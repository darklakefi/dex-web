"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetPoolDetailsOutput,
  GetPoolReservesOutput,
} from "@dex-web/orpc/schemas";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

export function usePoolDetails(
  tokenXMint: string,
  tokenYMint: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetPoolDetailsOutput | null> {
  return useQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint },
      ...options,
    }),
    queryKey: queryKeys.pools.details(tokenXMint, tokenYMint),
  });
}

export function usePoolDetailsSuspense(
  tokenXMint: string,
  tokenYMint: string,
): UseSuspenseQueryResult<GetPoolDetailsOutput> {
  return useSuspenseQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    queryKey: queryKeys.pools.details(tokenXMint, tokenYMint),
  });
}

export function usePoolReserves(
  tokenXMint: string,
  tokenYMint: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetPoolReservesOutput> {
  return useQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      input: { tokenXMint, tokenYMint },
      ...options,
    }),
    queryKey: queryKeys.pools.reserves(tokenXMint, tokenYMint),
  });
}

export function usePoolReservesSuspense(
  tokenXMint: string,
  tokenYMint: string,
): UseSuspenseQueryResult<GetPoolReservesOutput> {
  return useSuspenseQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    queryKey: queryKeys.pools.reserves(tokenXMint, tokenYMint),
  });
}

export function usePinnedPools(options?: {
  enabled?: boolean;
}): UseQueryResult<unknown> {
  return useQuery({
    ...tanstackClient.pools.getPinedPool.queryOptions({
      ...options,
    }),
    queryKey: queryKeys.pools.pinned(),
  });
}
