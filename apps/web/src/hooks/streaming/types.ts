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
    refetchInBackground: true,
    refetchOnWindowFocus: true,
    refreshInterval: 5000,
    staleTime: 3000,
  },
  high: {
    refetchInBackground: false,
    refetchOnWindowFocus: true,
    refreshInterval: 10000,
    staleTime: 7000,
  },
  low: {
    refetchInBackground: false,
    refetchOnWindowFocus: false,
    refreshInterval: 60000,
    staleTime: 50000,
  },
  normal: {
    refetchInBackground: false,
    refetchOnWindowFocus: true,
    refreshInterval: 30000,
    staleTime: 25000,
  },
};
