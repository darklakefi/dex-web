"use client";

import type { StatusCheckResult } from "@dex-web/core";
import { useQueryClient } from "@tanstack/react-query";
import type { TransactionStreamData } from "./types";
import { useServerSentEvents } from "./useServerSentEvents";
import { useStreamingQuery } from "./useStreamingQuery";

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
  const _queryClient = useQueryClient();
  const queryKey = ["transaction-status-stream", trackingId, tradeId];

  const fetchTransactionStatus =
    async (): Promise<TransactionStreamData | null> => {
      if (!trackingId) return null;

      const mockStatus: TransactionStreamData = {
        confirmations: 0,
        lastUpdate: Date.now(),
        signature: trackingId,
        status: "pending",
      };

      return mockStatus;
    };

  const sseQuery = useServerSentEvents<TransactionStreamData>(
    `/api/streams/transactions/${trackingId}${tradeId ? `?tradeId=${tradeId}` : ""}`,
    queryKey,
    {
      enableFallback: true,
      priority: "critical",
    },
  );

  const streamingQuery = useStreamingQuery(queryKey, fetchTransactionStatus, {
    enabled: !!trackingId,
    enableStreaming: enableStreaming && !enableSSE,
    priority: "critical",
  });

  const activeQuery = enableSSE ? sseQuery : streamingQuery;
  const transactionData = activeQuery.data;

  if (transactionData && onStatusUpdate) {
    onStatusUpdate(transactionData.status, transactionData);
  }

  if (transactionData) {
    const { status } = transactionData;

    if (successStates.includes(status) && onSuccess) {
      onSuccess({
        data: transactionData,
        status,
      });
    }

    if (failStates.includes(status) && onFailure) {
      onFailure({
        data: transactionData,
        error: transactionData.error,
        status,
      });
    }

    if (status === "finalized" && onFinalized) {
      onFinalized({
        data: transactionData,
        status,
      });
    }
  }

  const isTerminal =
    transactionData &&
    (successStates.includes(transactionData.status) ||
      failStates.includes(transactionData.status) ||
      transactionData.status === "finalized");

  return {
    confirmations: transactionData?.confirmations || 0,
    error: transactionData?.error || activeQuery.error?.message,
    isFailed: transactionData
      ? failStates.includes(transactionData.status)
      : false,
    isFallback: enableSSE ? sseQuery.isFallback : false,
    isFinalized: transactionData?.status === "finalized",
    isLoading: activeQuery.isLoading && !transactionData,
    isStreaming: enableSSE ? sseQuery.isStreaming : streamingQuery.isStreaming,
    isSuccess: transactionData
      ? successStates.includes(transactionData.status)
      : false,
    isTerminal,
    lastUpdate: transactionData?.lastUpdate || 0,
    refetch: activeQuery.refetch,
    signature: transactionData?.signature || trackingId || "",
    status: transactionData?.status || "unknown",
  };
}

export function useStreamingMultipleTransactionStatus({
  transactions,
  enableStreaming = true,
  enableSSE = true,
}: {
  transactions: Array<{ trackingId: string; tradeId?: string }>;
  enableStreaming?: boolean;
  enableSSE?: boolean;
}) {
  // Use a single query for all transactions instead of calling hooks in a loop
  const _queryClient = useQueryClient();
  const allTrackingIds = transactions.map((t) => t.trackingId).filter(Boolean);
  const queryKey = ["multiple-transaction-status", allTrackingIds.join(",")];

  const fetchMultipleTransactionStatus = async (): Promise<
    TransactionStreamData[]
  > => {
    if (allTrackingIds.length === 0) return [];

    // Mock implementation - in real scenario, this would fetch all transaction statuses
    return allTrackingIds.map((trackingId) => ({
      confirmations: 0,
      lastUpdate: Date.now(),
      signature: trackingId,
      status: "pending" as const,
    }));
  };

  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchMultipleTransactionStatus,
    {
      enabled: allTrackingIds.length > 0,
      enableStreaming: enableStreaming && !enableSSE,
      priority: "critical",
    },
  );

  const transactionData = streamingQuery.data || [];
  const totalTransactions = transactions.length;
  const successCount = transactionData.filter((t) =>
    ["confirmed", "finalized"].includes(t.status),
  ).length;
  const failedCount = transactionData.filter((t) =>
    ["failed", "rejected"].includes(t.status),
  ).length;
  const pendingCount = transactionData.filter(
    (t) => !["confirmed", "finalized", "failed", "rejected"].includes(t.status),
  ).length;

  return {
    isLoading: streamingQuery.isLoading,
    isStreaming: streamingQuery.isStreaming,
    summary: {
      completed: successCount + failedCount,
      failed: failedCount,
      isAllComplete: pendingCount === 0,
      isAllSuccess: successCount === totalTransactions,
      isAnyFailed: failedCount > 0,
      pending: pendingCount,
      success: successCount,
      total: totalTransactions,
    },
    transactions: transactionData.map((data, _index) => ({
      confirmations: data.confirmations,
      error: data.error,
      isFailed: ["failed", "rejected"].includes(data.status),
      isFallback: false,
      isFinalized: data.status === "finalized",
      isLoading: false,
      isStreaming: streamingQuery.isStreaming,
      isSuccess: ["confirmed", "finalized"].includes(data.status),
      isTerminal: ["confirmed", "finalized", "failed", "rejected"].includes(
        data.status,
      ),
      lastUpdate: data.lastUpdate,
      refetch: streamingQuery.refetch,
      signature: data.signature,
      status: data.status,
    })),
  };
}

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
  const _queryClient = useQueryClient();

  const streamResult = useStreamingTransactionStatus({
    enableSSE: true,
    enableStreaming: true,
    onFailure,
    onStatusUpdate: (status, _data) => {
      onStatusUpdate?.(status, 1);
    },
    onSuccess,
    trackingId,
    tradeId,
  });

  const timeoutMs = maxRetries * retryDelay;
  const isTimedOut =
    streamResult.lastUpdate > 0 &&
    Date.now() - streamResult.lastUpdate > timeoutMs &&
    !streamResult.isTerminal;

  if (isTimedOut && onTimeout) {
    onTimeout();
  }

  return {
    ...streamResult,
    checkTransactionStatus: streamResult.refetch,
    isTimedOut,
  };
}
