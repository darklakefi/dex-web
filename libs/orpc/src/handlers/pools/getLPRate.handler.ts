"use server";
import { toRawUnits } from "@dex-web/utils";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  GetLPRateInput,
  GetLPRateOutput,
} from "../../schemas/pools/getLPRate.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import {
  EXCHANGE_PROGRAM_ID,
  getPoolAccount,
  getTokenBalance,
} from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

function estimateLPTokens(
  tokenXAmount: BigNumber,
  tokenYAmount: BigNumber,
  poolXReserves: BigNumber,
  poolYReserves: BigNumber,
  poolLPSupply: BigNumber,
): BigNumber {
  const lpFromX = tokenXAmount
    .multipliedBy(poolLPSupply)
    .dividedBy(poolXReserves);

  const lpFromY = tokenYAmount
    .multipliedBy(poolLPSupply)
    .dividedBy(poolYReserves);

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

    const pool = await getPoolAccount(connection, poolPubkey).catch(
      (_error) => {
        throw new Error("Pool not found");
      },
    );

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

    // Calculate available reserves matching SDK's approach
    // Ensure all values are converted to BigNumber properly
    const liquidityReserveX = reserveXBalance
      .minus(new BigNumber((pool.user_locked_x || 0).toString()))
      .minus(new BigNumber((pool.locked_x || 0).toString()))
      .minus(new BigNumber((pool.protocol_fee_x || 0).toString()));
    const liquidityReserveY = reserveYBalance
      .minus(new BigNumber((pool.user_locked_y || 0).toString()))
      .minus(new BigNumber((pool.locked_y || 0).toString()))
      .minus(new BigNumber((pool.protocol_fee_y || 0).toString()));

    const poolLPSupply = new BigNumber(pool.token_lp_supply.toString());

    const tokenMetadata = (await getTokenMetadataHandler({
      addresses: [tokenXMint, tokenYMint],
      returnAsObject: true,
    })) as Record<string, Token>;
    const tokenX = tokenMetadata[tokenXMint];
    const tokenY = tokenMetadata[tokenYMint];
    const scaledTokenXAmount = toRawUnits(tokenXAmount, tokenX?.decimals ?? 0);
    const scaledTokenYAmount = toRawUnits(tokenYAmount, tokenY?.decimals ?? 0);

    const estimatedLP = estimateLPTokens(
      scaledTokenXAmount,
      scaledTokenYAmount,
      liquidityReserveX,
      liquidityReserveY,
      poolLPSupply,
    );

    const truncatedEstimatedLP = estimatedLP.integerValue(BigNumber.ROUND_DOWN);

    let finalEstimatedLP = truncatedEstimatedLP;
    if (input.slippage && input.slippage > 0) {
      const slippageDecimal = input.slippage / 100;

      const slippageAmount = truncatedEstimatedLP
        .multipliedBy(slippageDecimal)
        .integerValue(BigNumber.ROUND_DOWN);
      finalEstimatedLP = truncatedEstimatedLP.minus(slippageAmount);
    }
    return {
      estimatedLPTokens: finalEstimatedLP.toString(),
    };
  } catch (_error) {
    throw new Error("Failed to get LP rate");
  }
}
