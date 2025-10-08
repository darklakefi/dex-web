"use client";

import { DEFI_STREAM_CONFIGS, type DeFiStreamConfig } from "./types";
import { useServerSentEvents } from "./useServerSentEvents";

/**
 * Hook for managing streaming and polling configuration for transaction status.
 * Handles SSE connections for cache invalidation and provides polling config.
 */

interface UseTransactionStreamingParams {
  trackingId: string | null;
  tradeId?: string;
  enableStreaming?: boolean;
  enableSSE?: boolean;
  priority?: DeFiStreamConfig["priority"];
}

export function useTransactionStreaming({
  trackingId,
  tradeId,
  enableStreaming = true,
  enableSSE = true,
  priority = "critical",
}: UseTransactionStreamingParams) {
  const queryKey = ["transaction-status-stream", trackingId, tradeId];

  const config = DEFI_STREAM_CONFIGS[priority];

  // Use SSE for invalidation if enabled
  const sse = useServerSentEvents(
    enableSSE
      ? `/api/streams/transactions/${trackingId}${tradeId ? `?tradeId=${tradeId}` : ""}`
      : "",
    queryKey,
    { priority },
  );

  return {
    config,
    isStreaming: sse.isStreaming || enableStreaming,
    queryKey,
    sse,
  };
}
