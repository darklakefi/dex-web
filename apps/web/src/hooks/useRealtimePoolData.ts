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
  hasRecentTransaction?: boolean;
}

export function useRealtimePoolData({
  tokenXMint,
  tokenYMint,
  priority = "high",
  hasRecentTransaction = false,
}: UseRealtimePoolDataParams): UseQueryResult<PoolDetails | null, Error> {
  return usePoolData<PoolDetails | null>({
    hasRecentTransaction,
    priority,
    select: (data) => transformToPoolDetails(data, tokenXMint, tokenYMint),
    tokenXMint,
    tokenYMint,
  });
}
