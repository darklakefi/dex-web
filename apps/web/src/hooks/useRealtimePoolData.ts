"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { PoolDetails } from "../app/[lang]/liquidity/_types/liquidity.types";
import { transformToPoolDetails } from "../app/[lang]/liquidity/_utils/poolDataTransformers";
import type { QueryPriority } from "./queryConfig";
import { usePoolData } from "./usePoolData";

interface UseRealtimePoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: Extract<QueryPriority, "high" | "critical">;
}

/**
 * Convenience wrapper for pool data with liquidity-specific transformation.
 * Transforms raw pool reserves into the PoolDetails shape used by liquidity components.
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
