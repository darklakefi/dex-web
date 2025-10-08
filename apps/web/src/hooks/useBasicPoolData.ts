"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
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
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    tokenXMint,
    tokenYMint,
  );
  const poolKey = `${tokenXAddress}-${tokenYAddress}`;

  return useQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    queryKey: ["pool", poolKey],
    refetchInterval,
    refetchIntervalInBackground: true,
    retry: 2,
    retryDelay: 1000,
    select: (data) => (data ? { ...data, lastUpdate: Date.now() } : null),
    staleTime: 1000,
  });
}
