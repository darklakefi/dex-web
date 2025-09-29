"use server";

import { type Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  GetSwapRateInput,
  GetSwapRateOutput,
} from "../../schemas/swaps/getSwapRate.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import { toRawUnits } from "@dex-web/utils";
import {
  EXCHANGE_PROGRAM_ID,
  getPoolAccount,
  getTokenBalance,
  IDL_CODER,
  MAX_PERCENTAGE,
} from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

export type AmmConfig = {
  trade_fee_rate: number;
  protocol_fee_rate: number;
  index: number;
  creator: PublicKey;
  protocol_fee_collector: PublicKey;
  fund_fee_collector: PublicKey;
  protocol_owner: PublicKey;
  padding: number[];
};


function gateFee(sourceAmount: BigNumber, tradeFeeRate: BigNumber): BigNumber {
  return sourceAmount
    .multipliedBy(tradeFeeRate)
    .dividedBy(MAX_PERCENTAGE)
    .integerValue(BigNumber.ROUND_UP);
}

function swapBaseInputWithoutFees(
  sourceAmount: BigNumber,
  swapSourceAmount: BigNumber,
  swapDestinationAmount: BigNumber,
): BigNumber {
  const numerator = sourceAmount.multipliedBy(swapDestinationAmount);
  const denominator = swapSourceAmount.plus(sourceAmount);
  const destinationAmountSwapped = numerator
    .dividedBy(denominator)
    .integerValue(BigNumber.ROUND_DOWN);
  return destinationAmountSwapped;
}

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
  const tradeFee = gateFee(sourceAmount, tradeFeeRate);
  const protocolFee = gateFee(tradeFee, protocolFeeRate);

  const sourceAmountPostFees = sourceAmount.minus(tradeFee);

  const destinationAmountSwapped = swapBaseInputWithoutFees(
    sourceAmountPostFees,
    poolSourceAmount,
    poolDestinationAmount,
  );

  const rate = destinationAmountSwapped.dividedBy(sourceAmount);

  return {
    destinationAmount: destinationAmountSwapped,
    protocolFee,
    rate,
    sourceAmountPostFees,
    tradeFee,
  };
}

async function getAmmConfigAccount(
  connection: Connection,
  ammConfigPubkey: PublicKey,
): Promise<AmmConfig> {
  const accountInfo = await connection.getAccountInfo(ammConfigPubkey);

  if (!accountInfo) {
    throw new Error("AmmConfig not found");
  }

  try {
    const decodedData = IDL_CODER.accounts.decode("AmmConfig", accountInfo.data);

    const ammConfig: AmmConfig = {
      trade_fee_rate: decodedData.trade_fee_rate || 0,
      protocol_fee_rate: decodedData.protocol_fee_rate || 0,
      index: decodedData.index || 0,
      creator: decodedData.creator || new PublicKey("11111111111111111111111111111112"),
      protocol_fee_collector: decodedData.protocol_fee_collector || new PublicKey("11111111111111111111111111111112"),
      fund_fee_collector: decodedData.fund_fee_collector || new PublicKey("11111111111111111111111111111112"),
      protocol_owner: decodedData.protocol_owner || new PublicKey("11111111111111111111111111111112"),
      padding: decodedData.padding || [],
    };

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

    const pool = await getPoolAccount(connection, poolPubkey);
    const ammConfig = await getAmmConfigAccount(connection, ammConfigPubkey);

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

    const tokenX = tokenMetadata[tokenXMint]!;
    const tokenY = tokenMetadata[tokenYMint]!;

    const scaledInput = toRawUnits(
      amountIn,
      isXtoY ? tokenX.decimals : tokenY.decimals,
    );
    const roundedInput = scaledInput.integerValue(BigNumber.ROUND_DOWN);

    const tradeFeeRate = BigNumber(ammConfig.trade_fee_rate || 0);
    const protocolFeeRate = BigNumber(ammConfig.protocol_fee_rate || 0);
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
    const priceImpactTruncated = priceImpact.toFixed(2);

    return {
      amountIn,
      amountInRaw: roundedInput.toString(),
      amountOut: amountOut.toNumber(),
      amountOutRaw: amountOutBigDecimal.toString(),
      estimatedFee: swapResult.tradeFee.toString(),
      priceImpact: Number(priceImpactTruncated),
      rate: adjustedRate.toNumber(),
      tokenX,
      tokenY,
    };
  } catch (error) {
    console.error("Failed to get swap rate:", error);
    throw new Error("Failed to get swap rate");
  }
}
