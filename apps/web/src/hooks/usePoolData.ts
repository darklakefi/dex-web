/**
 * Pool Data Hook
 *
 * Fetches pool reserves data with intelligent polling and priority-based
 * refetch intervals. Automatically validates parameters and respects page
 * visibility to optimize performance.
 *
 * Key Features:
 * - Priority-based polling intervals (critical, high, normal, low)
 * - Automatic parameter validation
 * - Page visibility detection to pause polling
 * - keepPreviousData to prevent UI flicker during refetches
 * - Adaptive retry logic based on priority
 *
 * @module usePoolData
 */

"use client";

import type { GetPoolReservesOutput } from "@dex-web/orpc";
import { tanstackClient } from "@dex-web/orpc";
import type { UseQueryResult } from "@tanstack/react-query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  QUERY_REFETCH_INTERVALS,
  QUERY_STALE_TIMES,
  type QueryPriority,
} from "./queryConfig";
import { usePageVisibility } from "./usePageVisibility";

interface UsePoolDataParams {
  /** Mint address of token X in the pool */
  tokenXMint: string;
  /** Mint address of token Y in the pool */
  tokenYMint: string;
  /** Priority level determines polling frequency (default: "normal") */
  priority?: QueryPriority;
  /** Whether there's a recent transaction (uses "critical" priority) */
  hasRecentTransaction?: boolean;
  /** Whether the query should run (default: true if both mints provided) */
  enabled?: boolean;
}

export type PoolData = GetPoolReservesOutput;

/**
 * Hook to fetch pool reserves data with configurable priority and polling.
 *
 * This hook automatically validates that both token mints are provided before
 * making the API call. It uses priority-based polling intervals and retry logic
 * to balance between data freshness and API usage.
 *
 * Priority Levels:
 * - critical: 5s polling, 3 retries (for recent transactions)
 * - high: 10s polling, 2 retries (for active trading)
 * - normal: 30s polling, 1 retry (default)
 * - low: 60s polling, 1 retry (for background data)
 *
 * @param params - Configuration including token mints, priority, and optional select transform
 * @returns Query result with pool reserves data
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: poolReserves } = usePoolData({
 *   tokenXMint: tokenXAddress,
 *   tokenYMint: tokenYAddress,
 * });
 *
 * // With priority and data transformation
 * const { data: poolDetails } = usePoolData({
 *   tokenXMint: tokenXAddress,
 *   tokenYMint: tokenYAddress,
 *   priority: "high",
 *   hasRecentTransaction: true,
 *   select: (data) => transformToPoolDetails(data),
 * });
 * ```
 */
export function usePoolData<TData = PoolData>(
  params: UsePoolDataParams & {
    /** Optional transform function to select/transform the data */
    select?: (data: PoolData) => TData;
  },
): UseQueryResult<TData, Error> {
  const {
    tokenXMint,
    tokenYMint,
    priority = "normal",
    hasRecentTransaction = false,
    enabled = true,
    select,
  } = params;
  const isVisible = usePageVisibility();

  const effectivePriority = hasRecentTransaction ? "critical" : priority;
  const pollingInterval = QUERY_REFETCH_INTERVALS[effectivePriority];
  const staleTime = QUERY_STALE_TIMES[effectivePriority];

  return useQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    enabled: enabled && !!tokenXMint && !!tokenYMint,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchInterval: isVisible ? pollingInterval : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus:
      effectivePriority === "critical" || effectivePriority === "high",
    retry: (failureCount) => {
      const maxRetries =
        effectivePriority === "critical"
          ? 3
          : effectivePriority === "high"
            ? 2
            : 1;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select,
    staleTime,
  });
}

export type { UsePoolDataParams };
