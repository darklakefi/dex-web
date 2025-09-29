"use client";

import { useQuery } from "@tanstack/react-query";
import { tanstackClient } from "@dex-web/orpc";

interface UseOptimizedPoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: "high" | "normal" | "low";
}

const getQueryConfig = (priority: string) => {
  switch (priority) {
    case "high":
      return { refetchInterval: 10000, staleTime: 7000 };
    case "low":
      return { refetchInterval: 45000, staleTime: 30000 };
    default:
      return { refetchInterval: 15000, staleTime: 10000 };
  }
};

const createPoolKey = (tokenXMint: string, tokenYMint: string) => {
  const [tokenA, tokenB] = [tokenXMint, tokenYMint].sort();
  return `${tokenA}-${tokenB}`;
};

export function useOptimizedPoolData({
  tokenXMint,
  tokenYMint,
  priority = "normal",
}: UseOptimizedPoolDataParams) {
  const poolKey = createPoolKey(tokenXMint, tokenYMint);
  const config = getQueryConfig(priority);

  const { data: poolDetails, isLoading } = useQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      input: {
        tokenXMint,
        tokenYMint,
      },
    }),
    queryKey: ["pool-details", poolKey],
    ...config,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: priority === "high",
  });

  return {
    poolDetails,
    isSubscribed: true,
    isRealtime: true,
    isLoading,
  };
}