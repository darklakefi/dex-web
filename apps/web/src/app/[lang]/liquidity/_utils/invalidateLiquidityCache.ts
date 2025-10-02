import { tanstackClient } from "@dex-web/orpc";
import type { QueryClient } from "@tanstack/react-query";

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
    const userLiquidityOpts =
      tanstackClient.liquidity.getUserLiquidity.queryOptions({
        input: {
          ownerAddress: walletPublicKey,
          tokenXMint,
          tokenYMint,
        },
      });

    const poolDetailsOpts = tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint },
    });

    const poolReservesOpts = tanstackClient.pools.getPoolReserves.queryOptions({
      input: { tokenXMint, tokenYMint },
    });

    const poolKey = `${tokenXMint}-${tokenYMint}`;
    const sortedPoolKey = [tokenXMint, tokenYMint].sort().join("-");

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userLiquidityOpts.queryKey }),
      queryClient.invalidateQueries({ queryKey: poolDetailsOpts.queryKey }),
      queryClient.invalidateQueries({ queryKey: poolReservesOpts.queryKey }),
      queryClient.invalidateQueries({ queryKey: ["pool-details", poolKey] }),
      queryClient.invalidateQueries({
        queryKey: ["pool-details", sortedPoolKey],
      }),
      queryClient.invalidateQueries({
        queryKey: ["pool", tokenXMint, tokenYMint],
      }),
      queryClient.invalidateQueries({
        queryKey: ["pool", tokenYMint, tokenXMint],
      }),
      queryClient.invalidateQueries({
        queryKey: ["token-accounts", walletPublicKey],
      }),
    ]);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}
