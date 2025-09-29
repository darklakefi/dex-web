"use client";

export interface StreamConfig {
  refreshInterval: number;

  staleTime: number;

  refetchOnWindowFocus: boolean;

  refetchInBackground: boolean;
}

export interface DeFiStreamConfig extends StreamConfig {
  priority: "critical" | "high" | "normal" | "low";

  enablePollingFallback: boolean;
}

export interface StreamSubscription {
  id: string;

  cleanup: () => void;

  isActive: boolean;
}

export interface StreamData<T> {
  data: T | null;

  lastUpdate: number;

  error: Error | null;

  isLoading: boolean;

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

export const DEFI_STREAM_CONFIGS: Record<
  DeFiStreamConfig["priority"],
  StreamConfig
> = {
  critical: {
    refreshInterval: 1000,
    staleTime: 500,
    refetchOnWindowFocus: true,
    refetchInBackground: true,
  },
  high: {
    refreshInterval: 3000,
    staleTime: 2000,
    refetchOnWindowFocus: true,
    refetchInBackground: true,
  },
  normal: {
    refreshInterval: 10000,
    staleTime: 7000,
    refetchOnWindowFocus: true,
    refetchInBackground: false,
  },
  low: {
    refreshInterval: 30000,
    staleTime: 25000,
    refetchOnWindowFocus: false,
    refetchInBackground: false,
  },
};
