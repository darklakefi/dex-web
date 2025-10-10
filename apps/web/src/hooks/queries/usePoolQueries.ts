"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetPoolDetailsOutput,
  GetPoolReservesOutput,
} from "@dex-web/orpc/schemas/index";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

/**
 * Hook to fetch pool details for a token pair.
 * Uses oRPC's built-in queryOptions which includes proper query keys.
 */
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
    ...options,
  });
}

/**
 * Hook to fetch pool details with suspense for a token pair.
 * Uses oRPC's built-in queryOptions which includes proper query keys.
 */
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

/**
 * Hook to fetch pool reserves for a token pair.
 * Uses oRPC's built-in queryOptions with custom refetch settings.
 */
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
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Hook to fetch pool reserves with suspense for a token pair.
 * Uses oRPC's built-in queryOptions which includes proper query keys.
 */
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

/**
 * Hook to fetch pinned pools.
 * Uses oRPC's built-in queryOptions which includes proper query keys.
 */
export function usePinnedPools(options?: {
  enabled?: boolean;
}): UseQueryResult<unknown> {
  return useQuery({
    ...tanstackClient.pools.getPinedPool.queryOptions({
      context: { cache: "force-cache" as RequestCache },
    }),
    ...options,
  });
}
