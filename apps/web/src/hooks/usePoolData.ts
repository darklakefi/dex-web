"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";

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

export function usePoolData({
  tokenXMint,
  tokenYMint,
  priority = "normal",
}: UsePoolDataParams) {
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
    select: (data) => {
      if (!data || !data.exists) return null;

      return {
        exists: data.exists,
        lastUpdate: Date.now(),
        lpMint: data.lpMint,
        protocolFeeX: data.protocolFeeX,
        protocolFeeY: data.protocolFeeY,
        reserveX: data.reserveX,
        reserveXRaw: data.reserveXRaw,
        reserveY: data.reserveY,
        reserveYRaw: data.reserveYRaw,
        tokenXMint,
        tokenYMint,
        totalLpSupply: data.totalLpSupply,
        totalLpSupplyRaw: data.totalLpSupplyRaw,
        // Add new fields for transformer
        totalReserveXRaw: data.totalReserveXRaw,
        totalReserveYRaw: data.totalReserveYRaw,
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
