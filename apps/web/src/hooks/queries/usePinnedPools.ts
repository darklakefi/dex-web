"use client";

import { tanstackClient } from "@dex-web/orpc";
import type { GetPinedPoolOutput } from "@dex-web/orpc/schemas/index";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch pinned/featured pools.
 * Uses oRPC's built-in query key management.
 */
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
