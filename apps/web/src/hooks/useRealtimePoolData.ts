"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { PoolDetails } from "../app/[lang]/liquidity/_types/liquidity.types";
import { transformToPoolDetails } from "../app/[lang]/liquidity/_utils/poolDataTransformers";
import { usePoolData } from "./usePoolData";

interface UseRealtimePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: "high" | "critical";
}

/**
 * Hook to fetch realtime pool data transformed to PoolDetails format.
 * This is a convenience wrapper around usePoolData that applies the liquidity-specific transformation.
 *
 * Following Implementation Answer #3: Features define their own transformations.
 */
export function useRealtimePoolData({
  tokenXMint,
  tokenYMint,
  priority = "high",
}: UseRealtimePoolDataParams): UseQueryResult<PoolDetails | null, Error> {
  return usePoolData<PoolDetails | null>({
    priority,
    select: (data) => transformToPoolDetails(data, tokenXMint, tokenYMint),
    tokenXMint,
    tokenYMint,
  });
}
