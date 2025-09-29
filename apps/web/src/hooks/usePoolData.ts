"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@dex-web/orpc";

interface UsePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: "low" | "normal" | "high" | "critical";
}

interface PoolData {
  apr: number;
  tokenXMint: string;
  tokenXSymbol: string;
  tokenYMint: string;
  tokenYSymbol: string;
  tokenXReserve?: string;
  tokenYReserve?: string;
  lpSupply?: string;
  fee?: string;
  lastUpdate: number;
}

const STALE_TIME_CONFIG = {
  low: 60_000,
  normal: 30_000,
  high: 5_000,
  critical: 1_000,
} as const;

const REFETCH_INTERVAL_CONFIG = {
  low: 60_000,
  normal: 30_000,
  high: 5_000,
  critical: 1_000,
} as const;

export function usePoolData({
  tokenXMint,
  tokenYMint,
  priority = "normal",
}: UsePoolDataParams) {
  const poolKey = createSortedPoolKey(tokenXMint, tokenYMint);

  return useQuery({
    queryKey: ["pool", poolKey, tokenXMint, tokenYMint],
    queryFn: async (): Promise<PoolData | null> => {
      try {
        const result = await client.pools.getPoolDetails({
          tokenXMint,
          tokenYMint,
        });

        if (!result) return null;

        return {
          ...result,
          lastUpdate: Date.now(),
        };
      } catch (error) {
        console.error(`Failed to fetch pool data for ${poolKey}:`, error);
        throw error;
      }
    },
    staleTime: STALE_TIME_CONFIG[priority],
    gcTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVAL_CONFIG[priority],
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: priority === "critical" || priority === "high",
    retry: (failureCount, _error) => {
      const maxRetries =
        priority === "critical" ? 3 : priority === "high" ? 2 : 1;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

function createSortedPoolKey(tokenXMint: string, tokenYMint: string): string {
  const [tokenA, tokenB] = [tokenXMint, tokenYMint].sort();
  return `${tokenA}-${tokenB}`;
}

export type { PoolData, UsePoolDataParams };
