import { tanstackClient } from "@dex-web/orpc";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

export interface InvalidateLiquidityDataParams {
  ownerAddress: string;
  tokenXMint?: string;
  tokenYMint?: string;
}

export async function invalidateLiquidityData(
  queryClient: QueryClient,
  { ownerAddress, tokenXMint, tokenYMint }: InvalidateLiquidityDataParams,
): Promise<void> {
  const invalidations = [
    queryClient.invalidateQueries({
      queryKey: tanstackClient.liquidity.key(),
      refetchType: "active",
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.tokens.accounts(ownerAddress),
      refetchType: "active",
    }),
  ];

  if (tokenXMint && tokenYMint) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: tanstackClient.pools.getPoolReserves.key({
          input: { tokenXMint, tokenYMint },
        }),
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenAccounts.key({
          input: { mint: tokenXMint, ownerAddress },
        }),
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenAccounts.key({
          input: { mint: tokenYMint, ownerAddress },
        }),
        refetchType: "active",
      }),
    );
  } else {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: tanstackClient.pools.key(),
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenAccounts.key({
          input: { ownerAddress },
        }),
        refetchType: "active",
      }),
    );
  }

  await Promise.all(invalidations);
}

export interface InvalidateSwapDataParams {
  ownerAddress: string;
  tokenXMint?: string;
  tokenYMint?: string;
}

export async function invalidateSwapData(
  queryClient: QueryClient,
  { ownerAddress, tokenXMint, tokenYMint }: InvalidateSwapDataParams,
): Promise<void> {
  const invalidations = [
    queryClient.invalidateQueries({
      queryKey: queryKeys.tokens.accounts(ownerAddress),
      refetchType: "active",
    }),
  ];

  if (tokenXMint && tokenYMint) {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: tanstackClient.pools.getPoolReserves.key({
          input: { tokenXMint, tokenYMint },
        }),
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenAccounts.key({
          input: { mint: tokenXMint, ownerAddress },
        }),
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenAccounts.key({
          input: { mint: tokenYMint, ownerAddress },
        }),
        refetchType: "active",
      }),
    );
  } else {
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: tanstackClient.pools.key(),
        refetchType: "active",
      }),
      queryClient.invalidateQueries({
        queryKey: tanstackClient.helius.getTokenAccounts.key({
          input: { ownerAddress },
        }),
        refetchType: "active",
      }),
    );
  }

  await Promise.all(invalidations);
}
