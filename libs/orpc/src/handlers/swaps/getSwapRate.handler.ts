"use server";

import { type Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  GetSwapRateInput,
  GetSwapRateOutput,
} from "../../schemas/swaps/getSwapRate.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import {
  EXCHANGE_PROGRAM_ID,
  getPoolAccount,
  getTokenBalance,
  IDL_CODER,
  MAX_PERCENTAGE,
  toRawUnits,
} from "../../utils/solana";

// Helper function to calculate trade fee
function gateFee(sourceAmount: BigNumber, tradeFeeRate: BigNumber): BigNumber {
  // tradeFeeRate is in basis points (e.g., 1000000 = 100%, 1 = 0.0001%)
  // rounding up in our favor
  return sourceAmount
    .multipliedBy(tradeFeeRate)
    .dividedBy(MAX_PERCENTAGE)
    .integerValue(BigNumber.ROUND_UP);
}

// Constant product formula (like Uniswap AMM)
function swapBaseInputWithoutFees(
  sourceAmount: BigNumber,
  swapSourceAmount: BigNumber,
  swapDestinationAmount: BigNumber,
): BigNumber {
  // (x + delta_x) * (y - delta_y) = x * y
  // delta_y = (delta_x * y) / (x + delta_x)
  const numerator = sourceAmount.multipliedBy(swapDestinationAmount);
  const denominator = swapSourceAmount.plus(sourceAmount);
  const destinationAmountSwapped = numerator
    .dividedBy(denominator)
    .integerValue(BigNumber.ROUND_DOWN);
  return destinationAmountSwapped;
}

// Main swap calculation function
function calculateSwap(
  sourceAmount: BigNumber,
  poolSourceAmount: BigNumber,
  poolDestinationAmount: BigNumber,
  tradeFeeRate: BigNumber,
  protocolFeeRate: BigNumber,
): {
  destinationAmount: BigNumber;
  sourceAmountPostFees: BigNumber;
  rate: BigNumber;
  tradeFee: BigNumber;
  protocolFee: BigNumber;
} {
  // Calculate trade fee from input
  const tradeFee = gateFee(sourceAmount, tradeFeeRate);
  // Protocol fee is a percentage of the trade fee
  const protocolFee = gateFee(tradeFee, protocolFeeRate);

  // Subtract fee from input
  const sourceAmountPostFees = sourceAmount.minus(tradeFee);

  // Use post fee amount to calculate output
  const destinationAmountSwapped = swapBaseInputWithoutFees(
    sourceAmountPostFees,
    poolSourceAmount,
    poolDestinationAmount,
  );

  // Calculate rate (output per input)
  const rate = destinationAmountSwapped.dividedBy(sourceAmount);

  return {
    destinationAmount: destinationAmountSwapped,
    protocolFee,
    rate,
    sourceAmountPostFees,
    tradeFee,
  };
}

// The response should be CACHED (or outright provided as env param since fees will change almost never)
async function getAmmConfigAccount(
  connection: Connection,
  ammConfigPubkey: PublicKey,
): Promise<any> {
  const accountInfo = await connection.getAccountInfo(ammConfigPubkey);

  if (!accountInfo) {
    throw new Error("AmmConfig not found");
  }

  // Decode the AmmConfig account using Anchor's built-in decoder
  try {
    const ammConfig = IDL_CODER.accounts.decode("AmmConfig", accountInfo.data);
    return ammConfig;
  } catch (error) {
    console.error("Failed to decode AmmConfig account:", error);
    throw new Error("Failed to decode AmmConfig account data");
  }
}

export async function getSwapRateHandler(
  input: GetSwapRateInput,
): Promise<GetSwapRateOutput> {
  try {
    const { amountIn, isXtoY, tokenXMint, tokenYMint } = input;

    const helius = getHelius();

    const amm_config_index = Buffer.alloc(4);
    amm_config_index.writeUInt8(0, 0);

    const [ammConfigPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("amm_config"), amm_config_index],
      EXCHANGE_PROGRAM_ID,
    );

    const [poolPubkey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        ammConfigPubkey.toBuffer(),
        new PublicKey(tokenXMint).toBuffer(),
        new PublicKey(tokenYMint).toBuffer(),
      ],
      EXCHANGE_PROGRAM_ID,
    );

    const connection = helius.connection;

    // Fetch and parse both Pool and AmmConfig accounts
    const pool = await getPoolAccount(connection, poolPubkey);
    const ammConfig = await getAmmConfigAccount(connection, ammConfigPubkey);

    // Get token balances
    const reserveXBalance = await getTokenBalance(
      connection,
      pool.reserve_x,
      "Reserve X",
    );
    const reserveYBalance = await getTokenBalance(
      connection,
      pool.reserve_y,
      "Reserve Y",
    );

    const availableReserveX = reserveXBalance
      .minus(pool.locked_x)
      .minus(pool.user_locked_x)
      .minus(pool.protocol_fee_x);
    const availableReserveY = reserveYBalance
      .minus(pool.locked_y)
      .minus(pool.user_locked_y)
      .minus(pool.protocol_fee_y);

    const tokenMetadata = (await getTokenMetadataHandler({
      addresses: [tokenXMint, tokenYMint],
      returnAsObject: true,
    })) as Record<string, Token>;

    const scaledInput = toRawUnits(
      amountIn,
      isXtoY ? tokenX.decimals : tokenY.decimals,
    );
    const roundedInput = scaledInput.integerValue(BigNumber.ROUND_DOWN);

    const tradeFeeRate = BigNumber(ammConfig.trade_fee_rate) || BigNumber(0);
    const protocolFeeRate =
      BigNumber(ammConfig.protocol_fee_rate) || BigNumber(0);
    const swapResult = calculateSwap(
      roundedInput,
      isXtoY ? availableReserveX : availableReserveY,
      isXtoY ? availableReserveY : availableReserveX,
      tradeFeeRate,
      protocolFeeRate,
    );

    const amountOutBigDecimal = swapResult.destinationAmount;

    const amountOut = amountOutBigDecimal.dividedBy(
      toRawUnits(1, isXtoY ? tokenY.decimals : tokenX.decimals),
    );

    const decDiff = Math.abs(tokenX.decimals - tokenY.decimals);

    let adjustedRate = swapResult.rate;
    if (isXtoY) {
      if (tokenX.decimals < tokenY.decimals) {
        adjustedRate = swapResult.rate.dividedBy(toRawUnits(1, decDiff));
      } else if (tokenX.decimals > tokenY.decimals) {
        adjustedRate = swapResult.rate.multipliedBy(toRawUnits(1, decDiff));
      }
    } else {
      if (tokenY.decimals < tokenX.decimals) {
        adjustedRate = swapResult.rate.dividedBy(toRawUnits(1, decDiff));
      } else if (tokenY.decimals > tokenX.decimals) {
        adjustedRate = swapResult.rate.multipliedBy(toRawUnits(1, decDiff));
      }
    }

    const poolInputAmount = swapResult.sourceAmountPostFees
      .plus(swapResult.tradeFee)
      .minus(swapResult.protocolFee);

    const originalRate = isXtoY
      ? availableReserveY.dividedBy(availableReserveX)
      : availableReserveX.dividedBy(availableReserveY);

    const newAvailableReserveX = isXtoY
      ? availableReserveX.plus(poolInputAmount)
      : availableReserveX.minus(swapResult.destinationAmount);

    const newAvailableReserveY = isXtoY
      ? availableReserveY.minus(swapResult.destinationAmount)
      : availableReserveY.plus(poolInputAmount);

    const newRate = isXtoY
      ? newAvailableReserveY.dividedBy(newAvailableReserveX)
      : newAvailableReserveX.dividedBy(newAvailableReserveY);

    const priceImpact = originalRate
      .minus(newRate)
      .dividedBy(originalRate)
      .multipliedBy(100);
    const priceImpactTruncated = priceImpact.integerValue(BigNumber.ROUND_DOWN);

    return {
      amountIn,
      amountInRaw: roundedInput.toString(),
      amountOut: amountOut.toNumber(),
      amountOutRaw: amountOutBigDecimal.toString(),
      estimatedFee: swapResult.tradeFee.toString(),
      priceImpact: priceImpactTruncated.toNumber(),
      rate: adjustedRate.toNumber(),
      tokenX,
      tokenY,
    };
  } catch (error) {
    console.error("Failed to get swap rate:", error);
    throw new Error("Failed to get swap rate");
  }
}
