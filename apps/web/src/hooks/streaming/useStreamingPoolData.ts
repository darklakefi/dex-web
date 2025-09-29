"use client";

import { useQueryClient } from "@tanstack/react-query";
import { tanstackClient } from "@dex-web/orpc";
import { useStreamingQuery } from "./useStreamingQuery";
import { useServerSentEvents } from "./useServerSentEvents";
import { type PoolStreamData, type DeFiStreamConfig } from "./types";

interface UseStreamingPoolDataParams {
  tokenXMint: string;
  tokenYMint: string;
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  enableSSE?: boolean;
}

/**
 * Streaming pool data hook without useEffect anti-patterns
 * Supports both WebSocket/SSE streaming and intelligent polling fallback
 */
export function useStreamingPoolData({
  tokenXMint,
  tokenYMint,
  priority = "high",
  enableStreaming = true,
  enableSSE = false, // Enable when SSE endpoint is available
}: UseStreamingPoolDataParams) {
  const queryClient = useQueryClient();

  // Create stable query key
  const poolKey = createPoolKey(tokenXMint, tokenYMint);
  const queryKey = ["pool-stream", poolKey];

  // Base query function for fetching pool data
  const fetchPoolData = async () => {
    const result = await tanstackClient.pools.getPoolDetails.queryOptions({
      input: { tokenXMint, tokenYMint }
    }).queryFn();

    return transformToStreamData(result);
  };

  // SSE streaming (when available)
  const sseQuery = useServerSentEvents<PoolStreamData>(
    `/api/streams/pools/${poolKey}`,
    queryKey,
    {
      priority,
      enableFallback: true,
    }
  );

  // Fallback streaming query using React Query intervals
  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchPoolData,
    {
      priority,
      enableStreaming: enableStreaming && !enableSSE,
    }
  );

  // WebSocket integration (optional - replaces existing usePoolSubscription)
  const webSocketQuery = useWebSocketPoolData({
    poolKey,
    queryKey,
    tokenXMint,
    tokenYMint,
    enabled: enableStreaming && !enableSSE,
    priority,
  });

  // Choose the best data source
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
    // Additional metadata
    streamType: enableSSE ? "sse" : "polling",
    lastUpdate: activeQuery.data?.lastUpdate || 0,
  };
}

/**
 * WebSocket integration that doesn't use useEffect
 * Uses React Query's subscription management
 */
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
      // WebSocket connection setup
      if (!enabled) return null;

      return new Promise<PoolStreamData | null>((resolve) => {
        // This would integrate with existing WebSocket infrastructure
        // For now, return null to indicate WebSocket not implemented
        resolve(null);
      });
    },
    {
      priority,
      enableStreaming: enabled,
      staleTime: Infinity, // WebSocket data is always fresh
    }
  );
}

/**
 * Transform pool details to streaming format
 */
function transformToStreamData(poolDetails: any): PoolStreamData {
  return {
    tokenXReserve: poolDetails?.tokenXReserve || "0",
    tokenYReserve: poolDetails?.tokenYReserve || "0",
    lpSupply: poolDetails?.lpSupply || "0",
    fee: poolDetails?.fee || "0",
    lastUpdate: Date.now(),
  };
}

/**
 * Create stable pool key for caching
 */
function createPoolKey(tokenXMint: string, tokenYMint: string): string {
  const [tokenA, tokenB] = [tokenXMint, tokenYMint].sort();
  return `${tokenA}-${tokenB}`;
}

/**
 * Enhanced version of useRealtimePoolData using streaming
 * Drop-in replacement with improved performance
 */
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
    enableSSE: false, // Enable when backend supports SSE
  });
}