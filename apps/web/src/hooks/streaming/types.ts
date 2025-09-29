"use client";

/**
 * Core streaming types and interfaces for DeFi real-time data
 * Provides type-safe streaming data structures without useEffect dependencies
 */

export interface StreamConfig {
  /** Stream refresh interval in milliseconds */
  refreshInterval: number;
  /** Time before data is considered stale */
  staleTime: number;
  /** Whether to refetch when browser window gets focus */
  refetchOnWindowFocus: boolean;
  /** Whether to refetch in background */
  refetchInBackground: boolean;
}

export interface DeFiStreamConfig extends StreamConfig {
  /** Priority level affects refresh rates */
  priority: "critical" | "high" | "normal" | "low";
  /** Enable fallback to polling if streaming fails */
  enablePollingFallback: boolean;
}

export interface StreamSubscription {
  /** Unique identifier for the subscription */
  id: string;
  /** Cleanup function */
  cleanup: () => void;
  /** Whether subscription is active */
  isActive: boolean;
}

export interface StreamData<T> {
  /** The actual data */
  data: T | null;
  /** Last update timestamp */
  lastUpdate: number;
  /** Error if any */
  error: Error | null;
  /** Loading state */
  isLoading: boolean;
  /** Whether data is fresh */
  isFresh: boolean;
}

export interface PoolStreamData {
  tokenXReserve: string;
  tokenYReserve: string;
  lpSupply: string;
  fee: string;
  lastUpdate: number;
}

export interface TokenAccountStreamData {
  address: string;
  mint: string;
  owner: string;
  balance: string;
  lastUpdate: number;
}

export interface PriceStreamData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: number;
}

export interface TransactionStreamData {
  signature: string;
  status: "pending" | "confirmed" | "failed" | "finalized";
  confirmations: number;
  lastUpdate: number;
  error?: string;
}

/**
 * DeFi-specific streaming intervals optimized for trading
 */
export const DEFI_STREAM_CONFIGS: Record<DeFiStreamConfig["priority"], StreamConfig> = {
  critical: {
    refreshInterval: 1000, // 1 second for critical transaction status
    staleTime: 500,
    refetchOnWindowFocus: true,
    refetchInBackground: true,
  },
  high: {
    refreshInterval: 3000, // 3 seconds for active trading data
    staleTime: 2000,
    refetchOnWindowFocus: true,
    refetchInBackground: true,
  },
  normal: {
    refreshInterval: 10000, // 10 seconds for general pool data
    staleTime: 7000,
    refetchOnWindowFocus: true,
    refetchInBackground: false,
  },
  low: {
    refreshInterval: 30000, // 30 seconds for background monitoring
    staleTime: 25000,
    refetchOnWindowFocus: false,
    refetchInBackground: false,
  },
};