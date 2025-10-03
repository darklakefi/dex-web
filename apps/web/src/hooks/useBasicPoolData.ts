"use client";

import { client } from "@dex-web/orpc";
import { useQuery } from "@tanstack/react-query";

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
    queryFn: async () => {
      const result = await client.pools.getPoolDetails({
        tokenXMint,
        tokenYMint,
      });

      return result
        ? {
            ...result,
            lastUpdate: Date.now(),
          }
        : null;
    },
    queryKey: ["pool", poolKey],
    refetchInterval,
    refetchIntervalInBackground: true,
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000,
  });
}
