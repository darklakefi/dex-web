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
  hasRecentTransaction?: boolean;
}

export type PoolData = GetPoolReservesOutput;

export function usePoolData<TData = PoolData>(
  params: UsePoolDataParams & {
    select?: (data: PoolData) => TData;
  },
): UseQueryResult<TData, Error> {
  const {
    tokenXMint,
    tokenYMint,
    priority = "normal",
    hasRecentTransaction = false,
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
