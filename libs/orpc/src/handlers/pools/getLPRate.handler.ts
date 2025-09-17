"use server";

import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  GetLPRateInput,
  GetLPRateOutput,
} from "../../schemas/pools/getLPRate.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import { toRawUnits } from "@dex-web/utils";
import {
  EXCHANGE_PROGRAM_ID,
  getPoolAccount,
  getTokenBalance,
} from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

// LP token estimation function
function estimateLPTokens(
  tokenXAmount: BigNumber,
  tokenYAmount: BigNumber,
  poolXReserves: BigNumber,
  poolYReserves: BigNumber,
  poolLPSupply: BigNumber,
): BigNumber {
  // Use X token calculation
  const lpFromX = tokenXAmount
    .multipliedBy(poolLPSupply)
    .dividedBy(poolXReserves);

  // Use Y token calculation
  const lpFromY = tokenYAmount
    .multipliedBy(poolLPSupply)
    .dividedBy(poolYReserves);

  // Both should be equal if ratios match
  // Return the smaller one to be conservative
  return lpFromX.lt(lpFromY) ? lpFromX : lpFromY;
}

export async function getLPRateHandler(
  input: GetLPRateInput,
): Promise<GetLPRateOutput> {
  try {
    const { tokenXAmount, tokenYAmount, tokenXMint, tokenYMint } = input;

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

    // Fetch and parse Pool account
    const pool = await getPoolAccount(connection, poolPubkey);

    // Get token balances from reserve accounts
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

    // Calculate available reserves (excluding locked amounts and protocol fees)
    const liquidityReserveX = reserveXBalance
      .minus(pool.user_locked_x)
      .minus(pool.protocol_fee_x);
    const liquidityReserveY = reserveYBalance
      .minus(pool.user_locked_y)
      .minus(pool.protocol_fee_y);

    // Get LP token supply from pool account
    const poolLPSupply = BigNumber(pool.token_lp_supply);

    // Scale input amounts based on token decimals
    const tokenMetadata = (await getTokenMetadataHandler({
      addresses: [tokenXMint, tokenYMint],
      returnAsObject: true,
    })) as Record<string, Token>;

    const tokenX = tokenMetadata[tokenXMint];
    const tokenY = tokenMetadata[tokenYMint];

    const scaledTokenXAmount = toRawUnits(tokenXAmount, tokenX?.decimals ?? 0);
    const scaledTokenYAmount = toRawUnits(tokenYAmount, tokenY?.decimals ?? 0);

    // Estimate LP tokens using the formula
    const estimatedLP = estimateLPTokens(
      scaledTokenXAmount,
      scaledTokenYAmount,
      liquidityReserveX,
      liquidityReserveY,
      poolLPSupply,
    );

    // Truncate estimatedLP to 9 decimal precision to avoid max float values
    const truncatedEstimatedLP = estimatedLP.integerValue(BigNumber.ROUND_DOWN);

    // APPLY SLIPPAGE
    let finalEstimatedLP = truncatedEstimatedLP;

    if (input.slippage && input.slippage > 0) {
      // Calculate slippage as a decimal (e.g., 5.5% becomes 0.055)
      const slippageDecimal = input.slippage / 100;

      // Apply slippage to raw units and round down
      const slippageAmount = truncatedEstimatedLP
        .multipliedBy(slippageDecimal)
        .integerValue(BigNumber.ROUND_DOWN);
      finalEstimatedLP = truncatedEstimatedLP.minus(slippageAmount);
    }

    return {
      estimatedLPTokens: finalEstimatedLP.toString(),
    };
  } catch (error) {
    console.error("Failed to get LP rate:", error);
    throw new Error("Failed to get LP rate");
  }
}
