"use client";

import type { PublicKey } from "@solana/web3.js";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { tanstackClient } from "@dex-web/orpc";
import { useStreamingQuery } from "./useStreamingQuery";
import { useServerSentEvents } from "./useServerSentEvents";
import { type TokenAccountStreamData, type DeFiStreamConfig } from "./types";
import type { UseTokenAccountsReturn, TokenAccountsData } from "@dex-web/core";

interface UseStreamingTokenAccountsParams {
  publicKey: PublicKey | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  hasRecentTransaction?: boolean;
  enableStreaming?: boolean;
  enableSSE?: boolean;
}

/**
 * Streaming token accounts hook without useEffect anti-patterns
 * Provides adaptive refresh rates based on transaction activity
 */
export function useStreamingTokenAccounts({
  publicKey,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction = false,
  enableStreaming = true,
  enableSSE = false,
}: UseStreamingTokenAccountsParams): UseTokenAccountsReturn & {
  isRefreshingBuy: boolean;
  isRefreshingSell: boolean;
  isRealtimeBuy: boolean;
  isRealtimeSell: boolean;
  isRealtime: boolean;
  isStreaming: boolean;
  streamType: string;
} {
  const ownerAddress = publicKey?.toBase58();

  // Dynamic priority based on transaction activity
  const priority: DeFiStreamConfig["priority"] = hasRecentTransaction ? "high" : "normal";

  // Buy token account streaming
  const buyTokenQuery = useTokenAccountStream({
    mint: tokenAAddress,
    ownerAddress,
    priority,
    enableStreaming,
    enableSSE,
  });

  // Sell token account streaming
  const sellTokenQuery = useTokenAccountStream({
    mint: tokenBAddress,
    ownerAddress,
    priority,
    enableStreaming,
    enableSSE,
  });

  const isRefreshingBuy = buyTokenQuery.isLoading && !!buyTokenQuery.data;
  const isRefreshingSell = sellTokenQuery.isLoading && !!sellTokenQuery.data;

  return {
    buyTokenAccount: buyTokenQuery.data,
    sellTokenAccount: sellTokenQuery.data,
    refetchBuyTokenAccount: buyTokenQuery.refetch,
    refetchSellTokenAccount: sellTokenQuery.refetch,
    isLoadingBuy: buyTokenQuery.isLoading,
    isLoadingSell: sellTokenQuery.isLoading,
    isRefreshingBuy,
    isRefreshingSell,
    errorBuy: buyTokenQuery.error,
    errorSell: sellTokenQuery.error,
    isRealtimeBuy: !!publicKey && !!tokenAAddress,
    isRealtimeSell: !!publicKey && !!tokenBAddress,
    isRealtime: !!publicKey && !!tokenAAddress && !!tokenBAddress,
    isStreaming: enableStreaming,
    streamType: enableSSE ? "sse" : "polling",
  };
}

/**
 * Individual token account streaming hook
 */
function useTokenAccountStream({
  mint,
  ownerAddress,
  priority,
  enableStreaming,
  enableSSE,
}: {
  mint: string | null;
  ownerAddress: string | undefined;
  priority: DeFiStreamConfig["priority"];
  enableStreaming: boolean;
  enableSSE: boolean;
}) {
  const queryKey = ["token-account-stream", ownerAddress, mint];

  // Base query function
  const fetchTokenAccount = async (): Promise<TokenAccountsData | null> => {
    if (!mint || !ownerAddress) return null;

    const context: QueryFunctionContext = {
      queryKey,
      signal: new AbortController().signal,
      meta: undefined,
    };

    return tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint,
        ownerAddress,
      },
    }).queryFn(context);
  };

  // SSE streaming (when available)
  const sseQuery = useServerSentEvents<TokenAccountsData>(
    `/api/streams/token-accounts/${ownerAddress}/${mint}`,
    queryKey,
    {
      priority,
      enableFallback: true,
    }
  );

  // Fallback streaming query
  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchTokenAccount,
    {
      priority,
      enableStreaming: enableStreaming && !enableSSE,
      enabled: !!mint && !!ownerAddress,
    }
  );

  // Choose the best data source
  const activeQuery = enableSSE ? sseQuery : streamingQuery;

  return {
    data: activeQuery.data,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
  };
}

/**
 * Enhanced version of useRealtimeTokenAccounts using streaming
 * Drop-in replacement with improved performance and better UX
 */
export function useEnhancedRealtimeTokenAccounts({
  publicKey,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction = false,
}: {
  publicKey: PublicKey | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  hasRecentTransaction?: boolean;
}) {
  return useStreamingTokenAccounts({
    publicKey,
    tokenAAddress,
    tokenBAddress,
    hasRecentTransaction,
    enableStreaming: true,
    enableSSE: false, // Enable when backend supports SSE
  });
}