"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";

interface UsePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: "low" | "normal" | "high" | "critical";
}

/**
 * Raw pool data returned from the API.
 * This is the base type that features can transform into their own shapes.
 */
export interface PoolData {
  exists: boolean;
  lpMint: string;
  reserveX: number;
  reserveXRaw?: number;
  reserveY: number;
  reserveYRaw?: number;
  totalLpSupply: number;
  totalLpSupplyRaw?: number;
  tokenXMint: string;
  tokenYMint: string;
  lastUpdate: number;
  totalReserveXRaw?: number;
  totalReserveYRaw?: number;
  protocolFeeX?: number;
  protocolFeeY?: number;
  userLockedX?: number;
  userLockedY?: number;
}

const STALE_TIME_CONFIG = {
  critical: 3_000,
  high: 7_000,
  low: 60_000,
  normal: 30_000,
} as const;

const REFETCH_INTERVAL_CONFIG = {
  critical: 5_000,
  high: 10_000,
  low: 60_000,
  normal: 30_000,
} as const;

/**
 * Generic hook to fetch pool data. Returns raw API data by default.
 * Consumers can provide a select function to transform the data to their feature-specific types.
 *
 * Following Implementation Answer #3: Shared hooks should not depend on feature types.
 * This pattern keeps the hook reusable while allowing features to define their own transformations.
 *
 * @example
 * // Use raw data
 * const { data } = usePoolData({ tokenXMint, tokenYMint });
 *
 * @example
 * // Transform to feature-specific type
 * const { data } = usePoolData<PoolDetails>({
 *   tokenXMint,
 *   tokenYMint,
 *   select: transformToPoolDetails,
 * });
 *
 * @param params - tokenXMint, tokenYMint, optional priority, and optional select function
 * @returns TanStack Query result with either raw PoolData or transformed TData
 */
export function usePoolData<TData = PoolData>(
  params: UsePoolDataParams & {
    select?: (data: PoolData) => TData;
  },
) {
  const { tokenXMint, tokenYMint, priority = "normal", select } = params;
  const poolKey = createSortedPoolKey(tokenXMint, tokenYMint);

  return useQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    gcTime: 5 * 60 * 1000,
    queryKey: ["pool", poolKey, tokenXMint, tokenYMint],
    refetchInterval: REFETCH_INTERVAL_CONFIG[priority],
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: priority === "critical" || priority === "high",
    retry: (failureCount: number, _error: Error) => {
      const maxRetries =
        priority === "critical" ? 3 : priority === "high" ? 2 : 1;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    select,
    staleTime: STALE_TIME_CONFIG[priority],
  } as any);
}

function createSortedPoolKey(tokenXMint: string, tokenYMint: string): string {
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    tokenXMint,
    tokenYMint,
  );
  return `${tokenXAddress}-${tokenYAddress}`;
}

export type { UsePoolDataParams };
