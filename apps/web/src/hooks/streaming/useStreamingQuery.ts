"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { DEFI_STREAM_CONFIGS, type DeFiStreamConfig } from "./types";

interface StreamSubscriptionManager {
  subscribe: (key: string, callback: () => void) => () => void;
  unsubscribe: (key: string) => void;
  isSubscribed: (key: string) => boolean;
}

class InvalidationBasedSubscriptionManager
  implements StreamSubscriptionManager
{
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
    return (
      this.subscriptions.has(key) && this.subscriptions.get(key)!.length > 0
    );
  }

  private startInterval(_key: string, _callback: () => void): void {}

  private clearInterval(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }
}

const subscriptionManager = new InvalidationBasedSubscriptionManager();

interface UseStreamingQueryOptions {
  priority?: DeFiStreamConfig["priority"];
  enableStreaming?: boolean;
  enabled?: boolean;
}

export function useStreamingQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  queryFn?: () => Promise<TData>,
  options: UseStreamingQueryOptions = {},
) {
  const queryClient = useQueryClient();
  const {
    priority = "normal",
    enableStreaming = true,
    enabled = true,
  } = options;

  const config = DEFI_STREAM_CONFIGS[priority];
  const subscriptionKey = Array.isArray(queryKey)
    ? queryKey.join(":")
    : String(queryKey);

  // Trigger invalidation instead of managing data
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  // Set up interval-based invalidation if streaming is enabled
  if (enableStreaming && enabled) {
    // Note: Interval logic can be implemented if needed, but for now we rely on external triggers
  }

  // Return mock properties for backward compatibility
  return {
    data: undefined,
    error: null,
    invalidate,
    isLoading: false,
    isStreaming: enableStreaming,
    isSubscribed: subscriptionManager.isSubscribed(subscriptionKey),
    priority,
    refetch: invalidate,
    streamConfig: config,
  };
}
