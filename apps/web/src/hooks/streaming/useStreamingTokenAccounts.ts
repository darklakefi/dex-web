"use client";

import type { TokenAccountsData, UseTokenAccountsReturn } from "@dex-web/core";
import { tanstackClient } from "@dex-web/orpc";
import type { PublicKey } from "@solana/web3.js";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { QueryClient as QueryClientClass } from "@tanstack/react-query";
import type { DeFiStreamConfig } from "./types";
import { useServerSentEvents } from "./useServerSentEvents";
import { useStreamingQuery } from "./useStreamingQuery";

interface UseStreamingTokenAccountsParams {
  publicKey: PublicKey | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  hasRecentTransaction?: boolean;
  enableStreaming?: boolean;
  enableSSE?: boolean;
}

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

  const priority: DeFiStreamConfig["priority"] = hasRecentTransaction
    ? "high"
    : "normal";

  const buyTokenQuery = useTokenAccountStream({
    enableSSE,
    enableStreaming,
    mint: tokenAAddress,
    ownerAddress,
    priority,
  });

  const sellTokenQuery = useTokenAccountStream({
    enableSSE,
    enableStreaming,
    mint: tokenBAddress,
    ownerAddress,
    priority,
  });

  const isRefreshingBuy = buyTokenQuery.isLoading && !!buyTokenQuery.data;
  const isRefreshingSell = sellTokenQuery.isLoading && !!sellTokenQuery.data;

  return {
    buyTokenAccount: buyTokenQuery.data ?? undefined,
    errorBuy: buyTokenQuery.error,
    errorSell: sellTokenQuery.error,
    isLoadingBuy: buyTokenQuery.isLoading,
    isLoadingSell: sellTokenQuery.isLoading,
    isRealtime: !!publicKey && !!tokenAAddress && !!tokenBAddress,
    isRealtimeBuy: !!publicKey && !!tokenAAddress,
    isRealtimeSell: !!publicKey && !!tokenBAddress,
    isRefreshingBuy,
    isRefreshingSell,
    isStreaming: enableStreaming,
    refetchBuyTokenAccount: buyTokenQuery.refetch,
    refetchSellTokenAccount: sellTokenQuery.refetch,
    sellTokenAccount: sellTokenQuery.data ?? undefined,
    streamType: enableSSE ? "sse" : "polling",
  };
}

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

  const fetchTokenAccount = async (): Promise<TokenAccountsData | null> => {
    if (!mint || !ownerAddress) return null;

    const context: QueryFunctionContext = {
      client: new QueryClientClass(),
      meta: undefined,
      queryKey,
      signal: new AbortController().signal,
    };

    return tanstackClient.helius.getTokenAccounts
      .queryOptions({
        input: {
          mint,
          ownerAddress,
        },
      })
      .queryFn(context);
  };

  const sseQuery = useServerSentEvents<TokenAccountsData>(
    `/api/streams/token-accounts/${ownerAddress}/${mint}`,
    queryKey,
    {
      enableFallback: true,
      priority,
    },
  );

  const streamingQuery = useStreamingQuery(queryKey, fetchTokenAccount, {
    enabled: !!mint && !!ownerAddress,
    enableStreaming: enableStreaming && !enableSSE,
    priority,
  });

  const activeQuery = enableSSE ? sseQuery : streamingQuery;

  return {
    data: activeQuery.data,
    error: activeQuery.error,
    isLoading: activeQuery.isLoading,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    refetch: activeQuery.refetch,
  };
}

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
    enableSSE: false,
    enableStreaming: true,
    hasRecentTransaction,
    publicKey,
    tokenAAddress,
    tokenBAddress,
  });
}
