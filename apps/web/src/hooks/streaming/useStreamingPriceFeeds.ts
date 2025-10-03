"use client";

import type { DeFiStreamConfig } from "./types";
import { useServerSentEvents } from "./useServerSentEvents";
import { useStreamingQuery } from "./useStreamingQuery";

interface UseStreamingPriceFeedsParams {
  symbols: string[];
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  enableSSE?: boolean;
}

interface PriceFeedData {
  [symbol: string]: {
    price: number;
    change24h: number;
    volume24h: number;
    lastUpdate: number;
  };
}

export function useStreamingPriceFeeds({
  symbols,
  priority = "high",
  enableStreaming = true,
  enableSSE = true,
}: UseStreamingPriceFeedsParams) {
  const symbolsKey = symbols.sort().join(",");
  const queryKey = ["price-feeds-stream", symbolsKey];

  const fetchPriceData = async (): Promise<PriceFeedData> => {
    const priceData: PriceFeedData = {};

    for (const symbol of symbols) {
      priceData[symbol] = {
        change24h: (Math.random() - 0.5) * 10,
        lastUpdate: Date.now(),
        price: Math.random() * 100,
        volume24h: Math.random() * 1000000,
      };
    }

    return priceData;
  };

  const sseQuery = useServerSentEvents<PriceFeedData>(
    `/api/streams/prices?symbols=${symbolsKey}`,
    queryKey,
    {
      enableFallback: true,
      priority,
    },
  );

  const streamingQuery = useStreamingQuery(queryKey, fetchPriceData, {
    enableStreaming: enableStreaming && !enableSSE,
    priority,
  });

  const activeQuery = enableSSE ? sseQuery : streamingQuery;

  const pricesBySymbol = activeQuery.data || {};
  const pricesArray = symbols
    .map((symbol) => ({
      symbol,
      ...pricesBySymbol[symbol],
    }))
    .filter(Boolean);

  return {
    error: activeQuery.error,
    isFallback: enableSSE ? sseQuery.isFallback : false,
    isLoading: activeQuery.isLoading,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    lastUpdate: Math.max(...pricesArray.map((p) => p.lastUpdate || 0)),
    prices: pricesArray,
    pricesBySymbol,
    refetch: activeQuery.refetch,
  };
}

export function useStreamingTokenPrice({
  symbol,
  priority = "high",
  enableStreaming = true,
  enableSSE = true,
}: {
  symbol: string;
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  enableSSE?: boolean;
}) {
  const { prices, isLoading, error, isStreaming, isFallback, refetch } =
    useStreamingPriceFeeds({
      enableSSE,
      enableStreaming,
      priority,
      symbols: [symbol],
    });

  const priceData = prices[0] || null;

  return {
    change24h: priceData?.change24h || 0,
    error,
    isFallback,
    isLoading,
    isStreaming,
    lastUpdate: priceData?.lastUpdate || 0,
    price: priceData?.price || 0,
    refetch,
    volume24h: priceData?.volume24h || 0,
  };
}

export function useStreamingTradingPair({
  tokenA,
  tokenB,
  priority = "high",
  enableStreaming = true,
  enableSSE = true,
}: {
  tokenA: string;
  tokenB: string;
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  enableSSE?: boolean;
}) {
  const { pricesBySymbol, isLoading, error, isStreaming, isFallback, refetch } =
    useStreamingPriceFeeds({
      enableSSE,
      enableStreaming,
      priority,
      symbols: [tokenA, tokenB],
    });

  const tokenAPrice = pricesBySymbol[tokenA];
  const tokenBPrice = pricesBySymbol[tokenB];

  const ratio =
    tokenAPrice && tokenBPrice && tokenBPrice.price > 0
      ? tokenAPrice.price / tokenBPrice.price
      : 0;

  return {
    error,
    isFallback,
    isLoading,
    isStreaming,
    lastUpdate: Math.max(
      tokenAPrice?.lastUpdate || 0,
      tokenBPrice?.lastUpdate || 0,
    ),
    ratio,
    refetch,
    tokenA: {
      symbol: tokenA,
      ...tokenAPrice,
    },
    tokenB: {
      symbol: tokenB,
      ...tokenBPrice,
    },
  };
}
