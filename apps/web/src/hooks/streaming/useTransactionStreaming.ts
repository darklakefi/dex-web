"use client";

import { tanstackClient } from "@dex-web/orpc";
import {
  DEFI_STREAM_CONFIGS,
  type DeFiStreamConfig,
  type TransactionStreamData,
} from "./types";
import { useServerSentEvents } from "./useServerSentEvents";

/**
 * Hook for managing streaming and polling configuration for transaction status.
 * Handles SSE connections alongside polling configuration.
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
  const hasTrackingId = Boolean(trackingId);
  const config = DEFI_STREAM_CONFIGS[priority];

  const endpoint =
    enableSSE && hasTrackingId
      ? `/api/streams/transactions/${trackingId}${tradeId ? `?tradeId=${tradeId}` : ""}`
      : "";

  const queryOptions =
    tanstackClient.dexGateway.getTransactionStatus.queryOptions({
      input: { trackingId: trackingId || "", tradeId },
    });

  const sse = useServerSentEvents<TransactionStreamData>(
    endpoint,
    queryOptions.queryKey,
    {
      enabled: enableSSE && hasTrackingId,
      priority,
    },
  );

  return {
    config,
    isStreaming: (enableSSE && sse.isStreaming) || enableStreaming,
    queryKey: queryOptions.queryKey,
    sse,
  };
}
