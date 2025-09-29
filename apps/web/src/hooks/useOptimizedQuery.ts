"use client";

import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

type DataVolatility = "volatile" | "semi-static" | "static";

interface OptimizedQueryOptions<TData>
  extends Omit<UseQueryOptions<TData>, "staleTime" | "queryKey"> {
  volatility?: DataVolatility;
}

const STALE_TIME_MAP: Record<DataVolatility, number> = {
  "semi-static": 30 * 1000,
  static: Infinity,
  volatile: 3 * 1000,
};

export function useOptimizedQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData> = {},
) {
  const { volatility = "semi-static", ...restOptions } = options;

  return useQuery({
    ...restOptions,
    queryFn,
    queryKey,
    staleTime: STALE_TIME_MAP[volatility],
  });
}
