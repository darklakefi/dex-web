"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetPinedPoolOutput,
  GetPoolDetailsOutput,
  GetPoolReservesOutput,
} from "@dex-web/orpc/schemas/index";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

export function usePoolDetails(
  tokenXMint: string,
  tokenYMint: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetPoolDetailsOutput | null> {
  return useQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { tokenXMint, tokenYMint },
    }),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    staleTime: 1500,
    ...options,
  });
}

export function usePoolDetailsSuspense(
  tokenXMint: string,
  tokenYMint: string,
): UseSuspenseQueryResult<GetPoolDetailsOutput> {
  return useSuspenseQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { tokenXMint, tokenYMint },
    }),
  });
}

export function usePoolReserves(
  tokenXMint: string,
  tokenYMint: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetPoolReservesOutput> {
  return useQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { tokenXMint, tokenYMint },
    }),
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000,
    ...options,
  });
}

export function usePoolReservesSuspense(
  tokenXMint: string,
  tokenYMint: string,
): UseSuspenseQueryResult<GetPoolReservesOutput> {
  return useSuspenseQuery({
    ...tanstackClient.pools.getPoolReserves.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { tokenXMint, tokenYMint },
    }),
  });
}

export function usePinnedPools(options?: {
  enabled?: boolean;
}): UseQueryResult<GetPinedPoolOutput> {
  return useQuery({
    ...tanstackClient.pools.getPinedPool.queryOptions({
      context: { cache: "force-cache" as RequestCache },
    }),
    ...options,
  });
}
