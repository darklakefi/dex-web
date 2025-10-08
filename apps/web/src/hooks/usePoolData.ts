"use client";

import { client } from "@dex-web/orpc";
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
  reserveY: number;
  totalLpSupply: number;
  tokenXMint: string;
  tokenYMint: string;
  lastUpdate: number;
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
    gcTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PoolData | null> => {
      console.log("🔍 Fetching pool data:", { tokenXMint, tokenYMint });
      const result = await client.pools.getPoolReserves({
        tokenXMint,
        tokenYMint,
      });

      console.log("📊 Pool reserves result:", {
        exists: result?.exists,
        result,
        tokenXMint,
        tokenYMint,
      });

      if (!result || !result.exists) return null;

      return {
        exists: result.exists,
        lastUpdate: Date.now(),
        lpMint: result.lpMint,
        reserveX: result.reserveX,
        reserveY: result.reserveY,
        tokenXMint,
        tokenYMint,
        totalLpSupply: result.totalLpSupply,
      };
    },
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
    staleTime: STALE_TIME_CONFIG[priority],
  });
}

function createSortedPoolKey(tokenXMint: string, tokenYMint: string): string {
  const [tokenA, tokenB] = [tokenXMint, tokenYMint].sort();
  return `${tokenA}-${tokenB}`;
}

export type { PoolData, UsePoolDataParams };
