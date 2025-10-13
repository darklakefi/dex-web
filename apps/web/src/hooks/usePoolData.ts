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
  tokenXMint: string;
  tokenYMint: string;
  priority?: QueryPriority;
}

/**
 * Raw pool data returned from the API.
 * This is the base type that features can transform into their own shapes.
 */
export type PoolData = GetPoolReservesOutput;

/**
 * Fetches pool reserve data with configurable polling and caching.
 *
 * @param tokenXMint - First token mint address (sorted)
 * @param tokenYMint - Second token mint address (sorted)
 * @param priority - Controls polling frequency: "critical" (5s), "high" (10s), "normal" (30s), "low" (60s)
 * @param select - Optional transformer function to reshape data
 *
 * @example
 * const { data } = usePoolData({
 *   tokenXMint,
 *   tokenYMint,
 *   priority: "high",
 *   select: (data) => transformToPoolDetails(data, tokenXMint, tokenYMint),
 * });
 */
export function usePoolData<TData = PoolData>(
  params: UsePoolDataParams & {
    select?: (data: PoolData) => TData;
  },
): UseQueryResult<TData, Error> {
  const { tokenXMint, tokenYMint, priority = "normal", select } = params;
  const isVisible = usePageVisibility();

  return useQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    // Pause polling when page is hidden to save battery and bandwidth
    refetchInterval: isVisible ? QUERY_REFETCH_INTERVALS[priority] : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: priority === "critical" || priority === "high",
    retry: (failureCount) => {
      const maxRetries =
        priority === "critical" ? 3 : priority === "high" ? 2 : 1;
      return failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select,
    staleTime: QUERY_STALE_TIMES[priority],
  });
}

export type { UsePoolDataParams };
