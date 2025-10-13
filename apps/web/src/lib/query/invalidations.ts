import { tanstackClient } from "@dex-web/orpc";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";

export interface InvalidateLiquidityDataParams {
  ownerAddress: string;
}

export async function invalidateLiquidityData(
  queryClient: QueryClient,
  { ownerAddress }: InvalidateLiquidityDataParams,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: tanstackClient.liquidity.key(),
      refetchType: "active",
    }),

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

    queryClient.invalidateQueries({
      queryKey: queryKeys.tokens.accounts(ownerAddress),
      refetchType: "active",
    }),
  ]);
}

export interface InvalidateSwapDataParams {
  ownerAddress: string;
}

export async function invalidateSwapData(
  queryClient: QueryClient,
  { ownerAddress }: InvalidateSwapDataParams,
): Promise<void> {
  await Promise.all([
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

    queryClient.invalidateQueries({
      queryKey: queryKeys.tokens.accounts(ownerAddress),
      refetchType: "active",
    }),
  ]);
}
