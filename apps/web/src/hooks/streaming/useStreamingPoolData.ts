"use client";

import { tanstackClient } from "@dex-web/orpc";
import { useQueryClient } from "@tanstack/react-query";
import type { DeFiStreamConfig, PoolStreamData } from "./types";
import { useServerSentEvents } from "./useServerSentEvents";
import { useStreamingQuery } from "./useStreamingQuery";

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
      input: { tokenXMint, tokenYMint },
    });
    const result = await queryOptions.queryFn({
      client: queryClient,
      meta: undefined,
      queryKey: queryOptions.queryKey,
      signal: new AbortController().signal,
    });

    return result ? transformPoolDataToStream(result) : null;
  };

  const sseQuery = useServerSentEvents<PoolStreamData>(
    `/api/streams/pools/${poolKey}`,
    queryKey,
    {
      enableFallback: true,
      priority,
    },
  );

  const streamingQuery = useStreamingQuery(queryKey, fetchPoolData, {
    enableStreaming: enableStreaming && !enableSSE,
    priority,
  });

  const activeQuery = enableSSE ? sseQuery : streamingQuery;

  return {
    error: activeQuery.error,
    isLoading: activeQuery.isLoading,
    isRealtime: true,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    isSubscribed: enableSSE
      ? sseQuery.isStreaming
      : streamingQuery.isSubscribed,
    lastUpdate: activeQuery.data?.lastUpdate || 0,
    poolDetails: activeQuery.data,
    priority,
    refetch: activeQuery.refetch,
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
    enableSSE: true,
    enableStreaming: true,
    priority: "high",
    tokenXMint,
    tokenYMint,
  });
}
