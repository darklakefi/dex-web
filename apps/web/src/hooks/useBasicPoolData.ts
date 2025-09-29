"use client";

import { useQuery } from "@tanstack/react-query";
import { client } from "@dex-web/orpc";

interface UseBasicPoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  refetchInterval?: number;
}

export function useBasicPoolData({
  tokenXMint,
  tokenYMint,
  refetchInterval = 5000,
}: UseBasicPoolDataParams) {
  const poolKey = [tokenXMint, tokenYMint].sort().join("-");
  
  return useQuery({
    queryKey: ["pool", poolKey],
    queryFn: async () => {
        const result = await client.pools.getPoolDetails({
        tokenXMint,
        tokenYMint,
      });
      
      return result ? {
        ...result,
        lastUpdate: Date.now(),
      } : null;
    },
    staleTime: 1000,
    refetchInterval,
    refetchIntervalInBackground: true,
    retry: 2,
    retryDelay: 1000,
  });
}