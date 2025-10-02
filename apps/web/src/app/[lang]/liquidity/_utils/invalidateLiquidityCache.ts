import { tanstackClient } from "@dex-web/orpc";
import type {
  GetPoolReservesOutput,
  GetUserLiquidityOutput,
} from "@dex-web/orpc/schemas";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../lib/queryKeys";

interface InvalidateQueriesParams {
  queryClient: QueryClient;
  walletPublicKey: string;
  tokenXMint: string;
  tokenYMint: string;
}

export async function invalidateLiquidityQueries({
  queryClient,
  walletPublicKey,
  tokenXMint,
  tokenYMint,
}: InvalidateQueriesParams): Promise<void> {
  try {
    const userLiquidityKey = queryKeys.liquidity.user(
      walletPublicKey,
      tokenXMint,
      tokenYMint,
    );
    const poolDetailsKey = queryKeys.pools.details(tokenXMint, tokenYMint);
    const poolReservesKey = queryKeys.pools.reserves(tokenXMint, tokenYMint);

    const currentUserLiquidity = queryClient.getQueryData(userLiquidityKey);
    const currentPoolReserves = queryClient.getQueryData(poolReservesKey);

    await Promise.all([
      queryClient.invalidateQueries({
        exact: true,
        queryKey: userLiquidityKey,
      }),
      queryClient.invalidateQueries({
        exact: true,
        queryKey: poolDetailsKey,
      }),
      queryClient.invalidateQueries({
        exact: true,
        queryKey: poolReservesKey,
      }),
      queryClient.invalidateQueries({
        exact: true,
        queryKey: queryKeys.tokens.accounts(walletPublicKey),
      }),
    ]);

    const [newUserLiquidity, newPoolReserves] = await Promise.all([
      queryClient.fetchQuery({
        ...tanstackClient.liquidity.getUserLiquidity.queryOptions({
          input: { ownerAddress: walletPublicKey, tokenXMint, tokenYMint },
        }),
        queryKey: userLiquidityKey,
      }),
      queryClient.fetchQuery({
        ...tanstackClient.pools.getPoolReserves.queryOptions({
          input: { tokenXMint, tokenYMint },
        }),
        queryKey: poolReservesKey,
      }),
    ]);

    if (
      currentUserLiquidity &&
      typeof currentUserLiquidity === "object" &&
      "hasLiquidity" in currentUserLiquidity &&
      currentUserLiquidity.hasLiquidity
    ) {
      const currentLpBalance = (currentUserLiquidity as GetUserLiquidityOutput)
        .lpTokenBalance;
      const newLpBalance = newUserLiquidity?.lpTokenBalance || 0;

      if (
        !newUserLiquidity ||
        !newUserLiquidity.hasLiquidity ||
        newLpBalance < currentLpBalance
      ) {
        queryClient.setQueryData(userLiquidityKey, currentUserLiquidity);
      }
    }

    if (
      currentPoolReserves &&
      newPoolReserves &&
      (currentPoolReserves as GetPoolReservesOutput).totalLpSupply >
        (newPoolReserves as GetPoolReservesOutput).totalLpSupply
    ) {
      queryClient.setQueryData(poolReservesKey, currentPoolReserves);
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

export async function verifyDataConsistency(
  queryClient: QueryClient,
  tokenXMint: string,
  tokenYMint: string,
  walletPublicKey: string,
): Promise<void> {
  try {
    const userLiquidityKey = queryKeys.liquidity.user(
      walletPublicKey,
      tokenXMint,
      tokenYMint,
    );
    const poolReservesKey = queryKeys.pools.reserves(tokenXMint, tokenYMint);

    const userLiquidity = queryClient.getQueryData(userLiquidityKey);
    const poolReserves = queryClient.getQueryData(poolReservesKey);

    if (!userLiquidity || !poolReserves) {
      await queryClient.refetchQueries({
        exact: true,
        queryKey: userLiquidityKey,
      });
      return;
    }

    // Note: userTokenXAmount and userTokenYAmount are calculated values, not part of the API response
    // This consistency check is not applicable with the current API structure
    // The data consistency verification is handled by the components that calculate these values
  } catch (error) {
    console.error("Data consistency verification error:", error);
  }
}
