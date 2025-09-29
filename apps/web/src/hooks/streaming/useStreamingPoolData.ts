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

  const poolKey = createPoolKey(tokenXMint, tokenYMint);
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

    return transformToStreamData(result);
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

  const webSocketQuery = useWebSocketPoolData({
    poolKey,
    queryKey,
    tokenXMint,
    tokenYMint,
    enabled: enableStreaming && !enableSSE,
    priority,
  });

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


function useWebSocketPoolData({
  poolKey,
  queryKey,
  tokenXMint,
  tokenYMint,
  enabled,
  priority,
}: {
  poolKey: string;
  queryKey: string[];
  tokenXMint: string;
  tokenYMint: string;
  enabled: boolean;
  priority: DeFiStreamConfig["priority"];
}) {
  const queryClient = useQueryClient();

  return useStreamingQuery(
    [...queryKey, "websocket"],
    async () => {
      if (!enabled) return null;

      return new Promise<PoolStreamData | null>((resolve) => {
        resolve(null);
      });
    },
    {
      priority,
      enableStreaming: enabled,
      staleTime: Infinity, 
    }
  );
}


function transformToStreamData(poolDetails: any): PoolStreamData {
  return {
    tokenXReserve: poolDetails?.tokenXReserve || "0",
    tokenYReserve: poolDetails?.tokenYReserve || "0",
    lpSupply: poolDetails?.lpSupply || "0",
    fee: poolDetails?.fee || "0",
    lastUpdate: Date.now(),
  };
}


function createPoolKey(tokenXMint: string, tokenYMint: string): string {
  const [tokenA, tokenB] = [tokenXMint, tokenYMint].sort();
  return `${tokenA}-${tokenB}`;
}


export function useEnhancedRealtimePoolData({
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
    enableSSE: false, 
  });
}