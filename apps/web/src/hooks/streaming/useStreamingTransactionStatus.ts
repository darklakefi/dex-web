"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useStreamingQuery } from "./useStreamingQuery";
import { useServerSentEvents } from "./useServerSentEvents";
import { type TransactionStreamData, type DeFiStreamConfig } from "./types";
import type { StatusCheckResult } from "@dex-web/core";

interface UseStreamingTransactionStatusParams {
  trackingId: string | null;
  tradeId?: string;
  successStates?: string[];
  failStates?: string[];
  enableStreaming?: boolean;
  enableSSE?: boolean;
  onStatusUpdate?: (status: string, data: TransactionStreamData) => void;
  onSuccess?: (result: StatusCheckResult) => void;
  onFailure?: (result: StatusCheckResult) => void;
  onFinalized?: (result: StatusCheckResult) => void;
}

/**
 * Real-time transaction status streaming without useEffect
 * Provides immediate feedback for DeFi transactions
 */
export function useStreamingTransactionStatus({
  trackingId,
  tradeId,
  successStates = ["confirmed", "finalized"],
  failStates = ["failed", "rejected"],
  enableStreaming = true,
  enableSSE = true,
  onStatusUpdate,
  onSuccess,
  onFailure,
  onFinalized,
}: UseStreamingTransactionStatusParams) {
  const queryClient = useQueryClient();
  const queryKey = ["transaction-status-stream", trackingId, tradeId];

  // Base query function for transaction status
  const fetchTransactionStatus = async (): Promise<TransactionStreamData | null> => {
    if (!trackingId) return null;

    // This would integrate with your transaction status API
    // Mock implementation - replace with actual API call
    const mockStatus: TransactionStreamData = {
      signature: trackingId,
      status: "pending",
      confirmations: 0,
      lastUpdate: Date.now(),
    };

    return mockStatus;
  };

  // SSE streaming for transaction status (most critical for real-time updates)
  const sseQuery = useServerSentEvents<TransactionStreamData>(
    `/api/streams/transactions/${trackingId}${tradeId ? `?tradeId=${tradeId}` : ""}`,
    queryKey,
    {
      priority: "critical", // Highest priority for transaction status
      enableFallback: true,
    }
  );

  // Fallback streaming query with high-frequency polling
  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchTransactionStatus,
    {
      priority: "critical", // 1-second updates for transaction status
      enableStreaming: enableStreaming && !enableSSE,
      enabled: !!trackingId,
    }
  );

  // Choose the best data source
  const activeQuery = enableSSE ? sseQuery : streamingQuery;
  const transactionData = activeQuery.data;

  // Handle status updates
  if (transactionData && onStatusUpdate) {
    onStatusUpdate(transactionData.status, transactionData);
  }

  // Handle terminal states
  if (transactionData) {
    const { status } = transactionData;

    if (successStates.includes(status) && onSuccess) {
      onSuccess({
        status,
        data: transactionData,
      });
    }

    if (failStates.includes(status) && onFailure) {
      onFailure({
        status,
        data: transactionData,
        error: transactionData.error,
      });
    }

    if (status === "finalized" && onFinalized) {
      onFinalized({
        status,
        data: transactionData,
      });
    }
  }

  // Auto-cleanup when transaction reaches terminal state
  const isTerminal = transactionData && (
    successStates.includes(transactionData.status) ||
    failStates.includes(transactionData.status) ||
    transactionData.status === "finalized"
  );

  return {
    status: transactionData?.status || "unknown",
    signature: transactionData?.signature || trackingId || "",
    confirmations: transactionData?.confirmations || 0,
    lastUpdate: transactionData?.lastUpdate || 0,
    error: transactionData?.error || activeQuery.error?.message,
    isLoading: activeQuery.isLoading && !transactionData,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    isFallback: enableSSE ? sseQuery.isFallback : false,
    isTerminal,
    isSuccess: transactionData ? successStates.includes(transactionData.status) : false,
    isFailed: transactionData ? failStates.includes(transactionData.status) : false,
    isFinalized: transactionData?.status === "finalized",
    refetch: activeQuery.refetch,
  };
}

/**
 * Multiple transactions status streaming
 * Useful for batch operations or tracking multiple transactions
 */
export function useStreamingMultipleTransactionStatus({
  transactions,
  enableStreaming = true,
  enableSSE = true,
}: {
  transactions: Array<{ trackingId: string; tradeId?: string }>;
  enableStreaming?: boolean;
  enableSSE?: boolean;
}) {
  const results = transactions.map(({ trackingId, tradeId }) =>
    useStreamingTransactionStatus({
      trackingId,
      tradeId,
      enableStreaming,
      enableSSE,
    })
  );

  // Aggregate statistics
  const allStatuses = results.map(r => r.status);
  const totalTransactions = transactions.length;
  const successCount = results.filter(r => r.isSuccess).length;
  const failedCount = results.filter(r => r.isFailed).length;
  const pendingCount = results.filter(r => !r.isTerminal).length;

  return {
    transactions: results,
    summary: {
      total: totalTransactions,
      success: successCount,
      failed: failedCount,
      pending: pendingCount,
      completed: successCount + failedCount,
      isAllComplete: pendingCount === 0,
      isAnyFailed: failedCount > 0,
      isAllSuccess: successCount === totalTransactions,
    },
    isLoading: results.some(r => r.isLoading),
    isStreaming: results.every(r => r.isStreaming),
  };
}

/**
 * Enhanced transaction monitoring with automatic retry logic
 * Integrates with existing useTransactionStatus but uses streaming
 */
export function useEnhancedTransactionMonitoring({
  trackingId,
  tradeId,
  maxRetries = 10,
  retryDelay = 2000,
  onStatusUpdate,
  onSuccess,
  onFailure,
  onTimeout,
}: {
  trackingId: string | null;
  tradeId?: string;
  maxRetries?: number;
  retryDelay?: number;
  onStatusUpdate?: (status: string, attempt: number) => void;
  onSuccess?: (result: StatusCheckResult) => void;
  onFailure?: (result: StatusCheckResult) => void;
  onTimeout?: () => void;
}) {
  const queryClient = useQueryClient();

  const streamResult = useStreamingTransactionStatus({
    trackingId,
    tradeId,
    enableStreaming: true,
    enableSSE: true,
    onStatusUpdate: (status, data) => {
      onStatusUpdate?.(status, 1); // Always attempt 1 for streaming
    },
    onSuccess,
    onFailure,
  });

  // Auto-timeout after maxRetries * retryDelay
  const timeoutMs = maxRetries * retryDelay;
  const isTimedOut = streamResult.lastUpdate > 0 &&
    Date.now() - streamResult.lastUpdate > timeoutMs &&
    !streamResult.isTerminal;

  if (isTimedOut && onTimeout) {
    onTimeout();
  }

  return {
    ...streamResult,
    isTimedOut,
    checkTransactionStatus: streamResult.refetch,
  };
}