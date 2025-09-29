"use client";

import { useStreamingQuery } from "./useStreamingQuery";
import { useServerSentEvents } from "./useServerSentEvents";
import { type PriceStreamData, type DeFiStreamConfig } from "./types";

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

/**
 * Real-time price feeds streaming without useEffect
 * Optimized for high-frequency trading data
 */
export function useStreamingPriceFeeds({
  symbols,
  priority = "high",
  enableStreaming = true,
  enableSSE = true, // Price feeds benefit most from SSE
}: UseStreamingPriceFeedsParams) {
  const symbolsKey = symbols.sort().join(",");
  const queryKey = ["price-feeds-stream", symbolsKey];

  // Base query function for price data
  const fetchPriceData = async (): Promise<PriceFeedData> => {
    // This would integrate with your price data API
    // For now, return mock data structure
    const priceData: PriceFeedData = {};

    for (const symbol of symbols) {
      priceData[symbol] = {
        price: Math.random() * 100, // Mock price
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        lastUpdate: Date.now(),
      };
    }

    return priceData;
  };

  // SSE streaming for price feeds
  const sseQuery = useServerSentEvents<PriceFeedData>(
    `/api/streams/prices?symbols=${symbolsKey}`,
    queryKey,
    {
      priority,
      enableFallback: true,
    }
  );

  // Fallback streaming query
  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchPriceData,
    {
      priority,
      enableStreaming: enableStreaming && !enableSSE,
    }
  );

  // Choose the best data source
  const activeQuery = enableSSE ? sseQuery : streamingQuery;

  // Transform data for easier consumption
  const pricesBySymbol = activeQuery.data || {};
  const pricesArray = symbols.map(symbol => ({
    symbol,
    ...pricesBySymbol[symbol],
  })).filter(Boolean);

  return {
    prices: pricesArray,
    pricesBySymbol,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    isFallback: enableSSE ? sseQuery.isFallback : false,
    refetch: activeQuery.refetch,
    lastUpdate: Math.max(...pricesArray.map(p => p.lastUpdate || 0)),
  };
}

/**
 * Single token price streaming
 */
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
      symbols: [symbol],
      priority,
      enableStreaming,
      enableSSE,
    });

  const priceData = prices[0] || null;

  return {
    price: priceData?.price || 0,
    change24h: priceData?.change24h || 0,
    volume24h: priceData?.volume24h || 0,
    lastUpdate: priceData?.lastUpdate || 0,
    isLoading,
    error,
    isStreaming,
    isFallback,
    refetch,
  };
}

/**
 * Token pair price streaming for trading pairs
 */
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
      symbols: [tokenA, tokenB],
      priority,
      enableStreaming,
      enableSSE,
    });

  const tokenAPrice = pricesBySymbol[tokenA];
  const tokenBPrice = pricesBySymbol[tokenB];

  // Calculate trading pair ratio
  const ratio = tokenAPrice && tokenBPrice && tokenBPrice.price > 0
    ? tokenAPrice.price / tokenBPrice.price
    : 0;

  return {
    tokenA: {
      symbol: tokenA,
      ...tokenAPrice,
    },
    tokenB: {
      symbol: tokenB,
      ...tokenBPrice,
    },
    ratio,
    isLoading,
    error,
    isStreaming,
    isFallback,
    refetch,
    lastUpdate: Math.max(
      tokenAPrice?.lastUpdate || 0,
      tokenBPrice?.lastUpdate || 0
    ),
  };
}