"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import type { DeFiStreamConfig, PoolStreamData } from "./types";
import { DEFI_STREAM_CONFIGS } from "./types";
import { useServerSentEvents } from "./useServerSentEvents";

interface UseStreamingPoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  enableSSE?: boolean;
}

export function useStreamingPoolData({
  tokenXMint,
  tokenYMint,
  priority = "high",
  enableStreaming = true,
  enableSSE = false,
}: UseStreamingPoolDataParams) {
  const poolKey = createSortedPoolKey(tokenXMint, tokenYMint);
  const queryKey = ["pool-stream", poolKey];

  const config = DEFI_STREAM_CONFIGS[priority];

  const query = useQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint },
    }),
    queryKey,
    refetchInterval:
      enableStreaming && !enableSSE ? config.refreshInterval : false,
    refetchIntervalInBackground: config.refetchInBackground,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
    select: (data) => (data ? transformPoolDataToStream(data) : null),
    staleTime: config.staleTime,
  });

  // Use SSE for invalidation if enabled
  const sse = useServerSentEvents(
    enableSSE ? `/api/streams/pools/${poolKey}` : "",
    queryKey,
    { priority },
  );

  return {
    error: query.error,
    isLoading: query.isLoading,
    isRealtime: enableStreaming,
    isStreaming: sse.isStreaming || (enableStreaming && !enableSSE),
    isSubscribed: enableStreaming,
    lastUpdate: query.data?.lastUpdate || 0,
    poolDetails: query.data,
    priority,
    refetch: query.refetch,
    streamType: enableSSE ? "sse" : "polling",
  };
}

function transformPoolDataToStream(
  poolDetails: Record<string, unknown>,
): PoolStreamData {
  return {
    fee: String(poolDetails?.fee || "0"),
    lastUpdate: Date.now(),
    lpSupply: String(poolDetails?.lpSupply || "0"),
    tokenXReserve: String(poolDetails?.tokenXReserve || "0"),
    tokenYReserve: String(poolDetails?.tokenYReserve || "0"),
  };
}

function createSortedPoolKey(tokenXMint: string, tokenYMint: string): string {
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    tokenXMint,
    tokenYMint,
  );
  return `${tokenXAddress}-${tokenYAddress}`;
}

export function useHighFrequencyPoolData({
  tokenXMint,
  tokenYMint,
}: {
  tokenXMint: string;
  tokenYMint: string;
}) {
  return useStreamingPoolData({
    enableSSE: true,
    enableStreaming: true,
    priority: "high",
    tokenXMint,
    tokenYMint,
  });
}
