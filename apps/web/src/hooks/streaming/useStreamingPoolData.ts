"use client";

import { useQueryClient } from "@tanstack/react-query";
import { tanstackClient } from "@dex-web/orpc";
import { useStreamingQuery } from "./useStreamingQuery";
import { useServerSentEvents } from "./useServerSentEvents";
import type { PoolStreamData, DeFiStreamConfig } from "./types";

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
  const queryClient = useQueryClient();

  const poolKey = createSortedPoolKey(tokenXMint, tokenYMint);
  const queryKey = ["pool-stream", poolKey];

  const fetchPoolData = async () => {
    const queryOptions = tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint }
    });
    const result = await queryOptions.queryFn({ 
      client: queryClient,
      queryKey: queryOptions.queryKey, 
      signal: new AbortController().signal, 
      meta: undefined 
    });

    return result ? transformPoolDataToStream(result) : null;
  };

  const sseQuery = useServerSentEvents<PoolStreamData>(
    `/api/streams/pools/${poolKey}`,
    queryKey,
    {
      priority,
      enableFallback: true,
    }
  );

  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchPoolData,
    {
      priority,
      enableStreaming: enableStreaming && !enableSSE,
    }
  );

  const activeQuery = enableSSE ? sseQuery : streamingQuery;

  return {
    poolDetails: activeQuery.data,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    isRealtime: true,
    isSubscribed: enableSSE ? sseQuery.isStreaming : streamingQuery.isSubscribed,
    priority,
    refetch: activeQuery.refetch,
    streamType: enableSSE ? "sse" : "polling",
    lastUpdate: activeQuery.data?.lastUpdate || 0,
  };
}




function transformPoolDataToStream(poolDetails: Record<string, unknown>): PoolStreamData {
  return {
    tokenXReserve: String(poolDetails?.tokenXReserve || "0"),
    tokenYReserve: String(poolDetails?.tokenYReserve || "0"),
    lpSupply: String(poolDetails?.lpSupply || "0"),
    fee: String(poolDetails?.fee || "0"),
    lastUpdate: Date.now(),
  };
}


function createSortedPoolKey(tokenXMint: string, tokenYMint: string): string {
  const [tokenA, tokenB] = [tokenXMint, tokenYMint].sort();
  return `${tokenA}-${tokenB}`;
}


export function useHighFrequencyPoolData({
  tokenXMint,
  tokenYMint,
}: {
  tokenXMint: string;
  tokenYMint: string;
}) {
  return useStreamingPoolData({
    tokenXMint,
    tokenYMint,
    priority: "high",
    enableStreaming: true,
    enableSSE: true,
  });
}