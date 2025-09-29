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
        signature: trackingId,
        status: "pending",
        confirmations: 0,
        lastUpdate: Date.now(),
      };

      return mockStatus;
    };

  const sseQuery = useServerSentEvents<TransactionStreamData>(
    `/api/streams/transactions/${trackingId}${tradeId ? `?tradeId=${tradeId}` : ""}`,
    queryKey,
    {
      priority: "critical",
      enableFallback: true,
    },
  );

  const streamingQuery = useStreamingQuery(queryKey, fetchTransactionStatus, {
    priority: "critical",
    enableStreaming: enableStreaming && !enableSSE,
    enabled: !!trackingId,
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

  const isTerminal =
    transactionData &&
    (successStates.includes(transactionData.status) ||
      failStates.includes(transactionData.status) ||
      transactionData.status === "finalized");

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
    isSuccess: transactionData
      ? successStates.includes(transactionData.status)
      : false,
    isFailed: transactionData
      ? failStates.includes(transactionData.status)
      : false,
    isFinalized: transactionData?.status === "finalized",
    refetch: activeQuery.refetch,
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
      signature: trackingId,
      status: "pending" as const,
      confirmations: 0,
      lastUpdate: Date.now(),
    }));
  };

  const streamingQuery = useStreamingQuery(
    queryKey,
    fetchMultipleTransactionStatus,
    {
      priority: "critical",
      enableStreaming: enableStreaming && !enableSSE,
      enabled: allTrackingIds.length > 0,
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
    transactions: transactionData.map((data, _index) => ({
      status: data.status,
      signature: data.signature,
      confirmations: data.confirmations,
      lastUpdate: data.lastUpdate,
      error: data.error,
      isLoading: false,
      isStreaming: streamingQuery.isStreaming,
      isFallback: false,
      isTerminal: ["confirmed", "finalized", "failed", "rejected"].includes(
        data.status,
      ),
      isSuccess: ["confirmed", "finalized"].includes(data.status),
      isFailed: ["failed", "rejected"].includes(data.status),
      isFinalized: data.status === "finalized",
      refetch: streamingQuery.refetch,
    })),
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
    isLoading: streamingQuery.isLoading,
    isStreaming: streamingQuery.isStreaming,
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
    trackingId,
    tradeId,
    enableStreaming: true,
    enableSSE: true,
    onStatusUpdate: (status, _data) => {
      onStatusUpdate?.(status, 1);
    },
    onSuccess,
    onFailure,
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
    isTimedOut,
    checkTransactionStatus: streamResult.refetch,
  };
}
