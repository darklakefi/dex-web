"use server";

import { getHelius } from "../../getHelius";
import type {
  GetUserLiquidityInput,
  GetUserLiquidityOutput,
} from "../../schemas/pools/getUserLiquidity.schema";
import { getLpTokenMint } from "../../utils/getLpTokenMint";
import { LP_TOKEN_DECIMALS } from "../../utils/solana";

export async function getUserLiquidityHandler({
  tokenXMint,
  tokenYMint,
  ownerAddress,
}: GetUserLiquidityInput): Promise<GetUserLiquidityOutput> {
  const helius = getHelius();

  try {
    if (!ownerAddress) {
      console.warn("No owner address provided for liquidity lookup");
      return {
        decimals: LP_TOKEN_DECIMALS,
        hasLiquidity: false,
        lpTokenBalance: 0,
        lpTokenMint: "",
      };
    }

    const lpTokenMint = await getLpTokenMint(tokenXMint, tokenYMint);
    const lpTokenMintString = lpTokenMint.toBase58();

    console.log("Looking up LP token accounts:", {
      lpTokenMint: lpTokenMintString,
      ownerAddress,
      tokenXMint,
      tokenYMint,
    });

    const lpTokenAccountsResponse = await helius.rpc.getTokenAccounts({
      mint: lpTokenMintString,
      owner: ownerAddress,
      page: 1,
    });

    console.log("LP token accounts response:", lpTokenAccountsResponse);

    const lpTokenBalance =
      lpTokenAccountsResponse?.token_accounts?.reduce(
        (total, account) => total + (account.amount || 0),
        0,
      ) || 0;

    console.log("Calculated LP token balance:", lpTokenBalance);

    return {
      decimals: LP_TOKEN_DECIMALS,
      hasLiquidity: lpTokenBalance > 0,
      lpTokenBalance,
      lpTokenMint: lpTokenMintString,
    };
  } catch (error) {
    console.error("Error getting user liquidity:", error);
    console.error("Error details:", {
      error: error instanceof Error ? error.message : error,
      ownerAddress,
      tokenXMint,
      tokenYMint,
    });
    return {
      decimals: LP_TOKEN_DECIMALS,
      hasLiquidity: false,
      lpTokenBalance: 0,
      lpTokenMint: "",
    };
  }
}
