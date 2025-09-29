"use client";

import { useQuery, type UseQueryOptions, type QueryKey } from "@tanstack/react-query";
import { type DeFiStreamConfig, DEFI_STREAM_CONFIGS } from "./types";

/**
 * Stream subscription manager without useEffect
 * Uses React Query's built-in subscription management
 */
interface StreamSubscriptionManager {
  subscribe: (key: string, callback: () => void) => () => void;
  unsubscribe: (key: string) => void;
  isSubscribed: (key: string) => boolean;
}

class QueryBasedSubscriptionManager implements StreamSubscriptionManager {
  private subscriptions = new Map<string, (() => void)[]>();
  private intervals = new Map<string, NodeJS.Timeout>();

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }

    const callbacks = this.subscriptions.get(key)!;
    callbacks.push(callback);

    if (callbacks.length === 1) {
      this.startInterval(key, callback);
    }

    return () => {
      const currentCallbacks = this.subscriptions.get(key);
      if (currentCallbacks) {
        const index = currentCallbacks.indexOf(callback);
        if (index > -1) {
          currentCallbacks.splice(index, 1);
        }

        if (currentCallbacks.length === 0) {
          this.clearInterval(key);
          this.subscriptions.delete(key);
        }
      }
    };
  }

  unsubscribe(key: string): void {
    this.clearInterval(key);
    this.subscriptions.delete(key);
  }

  isSubscribed(key: string): boolean {
    return this.subscriptions.has(key) && this.subscriptions.get(key)!.length > 0;
  }

  private startInterval(_key: string, _callback: () => void): void {
  }

  private clearInterval(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }
}

const subscriptionManager = new QueryBasedSubscriptionManager();

/**
 * Streaming query hook without useEffect anti-patterns
 * Uses React Query's lifecycle for subscription management
 */
interface UseStreamingQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, "queryKey" | "refetchInterval"> {
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  fallbackToPolling?: boolean;
}

export function useStreamingQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: UseStreamingQueryOptions<TData, TError> = {}
) {
  const {
    priority = "normal",
    enableStreaming = true,
    fallbackToPolling: _fallbackToPolling = true,
    ...restOptions
  } = options;

  const config = DEFI_STREAM_CONFIGS[priority];
  const subscriptionKey = Array.isArray(queryKey) ? queryKey.join(":") : String(queryKey);

  const query = useQuery({
    queryKey,
    queryFn,
    refetchInterval: enableStreaming ? config.refreshInterval : false,
    refetchIntervalInBackground: config.refetchInBackground,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
    staleTime: config.staleTime,
    ...restOptions,
  });

  return {
    ...query,
    isStreaming: enableStreaming,
    isSubscribed: subscriptionManager.isSubscribed(subscriptionKey),
    priority,
    streamConfig: config,
  };
}