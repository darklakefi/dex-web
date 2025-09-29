"use client";

/**
 * Streaming data hooks for DeFi applications
 * Real-time updates without useEffect anti-patterns
 */

// Core streaming utilities
export { useStreamingQuery } from "./useStreamingQuery";
export { useServerSentEvents } from "./useServerSentEvents";

// Specific streaming implementations
export {
  useStreamingPoolData,
  useEnhancedRealtimePoolData,
} from "./useStreamingPoolData";

export {
  useStreamingTokenAccounts,
  useEnhancedRealtimeTokenAccounts,
} from "./useStreamingTokenAccounts";

export {
  useStreamingPriceFeeds,
  useStreamingTokenPrice,
  useStreamingTradingPair,
} from "./useStreamingPriceFeeds";

export {
  useStreamingTransactionStatus,
  useStreamingMultipleTransactionStatus,
  useEnhancedTransactionMonitoring,
} from "./useStreamingTransactionStatus";

// Types and configurations
export type {
  StreamConfig,
  DeFiStreamConfig,
  StreamSubscription,
  StreamData,
  PoolStreamData,
  TokenAccountStreamData,
  PriceStreamData,
  TransactionStreamData,
} from "./types";

export { DEFI_STREAM_CONFIGS } from "./types";