"use server";

import { getLpTokenMint } from "@dex-web/core";
import { getHelius } from "../../getHelius";
import type {
  GetAllUserLiquidityInput,
  GetAllUserLiquidityOutput,
  UserLiquidityPosition,
} from "../../schemas/liquidity/getAllUserLiquidity.schema";
import { LP_TOKEN_DECIMALS } from "../../utils/solana";
import { getAllPoolsHandler } from "../pools/getAllPools.handler";

/**
 * Get ALL liquidity positions for a user across ALL pools
 * This is more expensive than getUserLiquidity but shows complete picture
 */
export async function getAllUserLiquidityHandler({
  ownerAddress,
}: GetAllUserLiquidityInput): Promise<GetAllUserLiquidityOutput> {
  const helius = getHelius();

  try {
    if (!ownerAddress || ownerAddress.trim() === "") {
      console.warn("No owner address provided for liquidity lookup");
      return {
        positions: [],
        totalPositions: 0,
      };
    }

    console.log("📡 Fetching all pools...");
    const poolsResult = await getAllPoolsHandler({
      includeEmpty: false,
    });
    console.log("📦 Pools result:", {
      firstPool: poolsResult.pools[0],
      poolCount: poolsResult.pools.length,
      total: poolsResult.total,
    });

    const allPools = poolsResult.pools;
    console.log(`Checking ${allPools.length} pools for user liquidity`);

    const liquidityPositions: UserLiquidityPosition[] = [];

    for (const pool of allPools) {
      try {
        const lpTokenMint = await getLpTokenMint(
          pool.tokenXMint,
          pool.tokenYMint,
        );
        const lpTokenMintString = lpTokenMint.toBase58();

        const lpTokenAccountsResponse = await helius.getTokenAccounts({
          mint: lpTokenMintString,
          owner: ownerAddress,
        });

        const lpTokenBalance =
          lpTokenAccountsResponse?.token_accounts?.reduce(
            (total, account) => total + (account?.amount ?? 0),
            0,
          ) ?? 0;

        if (lpTokenBalance > 0) {
          liquidityPositions.push({
            decimals: LP_TOKEN_DECIMALS,
            hasLiquidity: true,
            lpTokenBalance,
            lpTokenMint: lpTokenMintString,
            poolAddress: pool.address,
            tokenXMint: pool.tokenXMint,
            tokenYMint: pool.tokenYMint,
          });
        }
      } catch (error) {
        console.error(
          `Error checking pool ${pool.tokenXMint}/${pool.tokenYMint}:`,
          error,
        );
      }
    }

    console.log(`Found ${liquidityPositions.length} liquidity positions`);

    return {
      positions: liquidityPositions,
      totalPositions: liquidityPositions.length,
    };
  } catch (error) {
    console.error("Error getting all user liquidity:", error);
    return {
      positions: [],
      totalPositions: 0,
    };
  }
}
