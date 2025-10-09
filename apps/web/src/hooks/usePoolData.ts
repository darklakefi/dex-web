"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import type { PoolDetails } from "../app/[lang]/liquidity/_types/liquidity.types";

interface UsePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: "low" | "normal" | "high" | "critical";
}

interface PoolData {
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
  // Add new fields for transformer
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
 * Hook to fetch and transform pool data with configurable priority.
 *
 * Following Answer #5 best practice: Use TanStack Query's `select` for transformations.
 * This ensures components only re-render when the transformed data changes, not on every
 * raw API response change.
 *
 * @param params - tokenXMint, tokenYMint, and optional priority
 * @returns TanStack Query result with transformed PoolDetails
 */
export function usePoolData({
  tokenXMint,
  tokenYMint,
  priority = "normal",
}: UsePoolDataParams): any {
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
    retry: (failureCount, _error) => {
      const maxRetries =
        priority === "critical" ? 3 : priority === "high" ? 2 : 1;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Transform data within select for optimal performance
    // Component only re-renders when transformed PoolDetails changes
    select: (data): PoolDetails | null => {
      if (!data || !data.exists) return null;

      // Transform to PoolDetails format used by liquidity forms
      return {
        fee: undefined,
        poolAddress: data.lpMint,
        price: undefined,
        protocolFeeX: data.protocolFeeX,
        protocolFeeY: data.protocolFeeY,
        tokenXMint,
        tokenXReserve: data.reserveX,
        tokenXReserveRaw: data.reserveXRaw,
        tokenYMint,
        tokenYReserve: data.reserveY,
        tokenYReserveRaw: data.reserveYRaw,
        totalReserveXRaw: data.totalReserveXRaw,
        totalReserveYRaw: data.totalReserveYRaw,
        totalSupply: data.totalLpSupply,
        totalSupplyRaw: data.totalLpSupplyRaw,
        userLockedX: data.userLockedX,
        userLockedY: data.userLockedY,
      };
    },
    staleTime: STALE_TIME_CONFIG[priority],
  });
}

function createSortedPoolKey(tokenXMint: string, tokenYMint: string): string {
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    tokenXMint,
    tokenYMint,
  );
  return `${tokenXAddress}-${tokenYAddress}`;
}

export type { PoolData, UsePoolDataParams };
