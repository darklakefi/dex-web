"use client";

import type { StatusCheckResult } from "@dex-web/core";
import { useEffect } from "react";
import type { TransactionStreamData } from "./types";

/**
 * Hook for monitoring transaction status changes and triggering callbacks.
 * Handles status updates, success/failure/finalized events, and terminal state detection.
 */

interface UseTransactionMonitoringParams {
  transactionData: TransactionStreamData | undefined;
  successStates?: string[];
  failStates?: string[];
  onStatusUpdate?: (status: string, data: TransactionStreamData) => void;
  onSuccess?: (result: StatusCheckResult) => void;
  onFailure?: (result: StatusCheckResult) => void;
  onFinalized?: (result: StatusCheckResult) => void;
}

export function useTransactionMonitoring({
  transactionData,
  successStates = ["confirmed", "finalized"],
  failStates = ["failed", "rejected"],
  onStatusUpdate,
  onSuccess,
  onFailure,
  onFinalized,
}: UseTransactionMonitoringParams) {
  useEffect(() => {
    if (transactionData && onStatusUpdate) {
      onStatusUpdate(transactionData.status, transactionData);
    }
  }, [transactionData, onStatusUpdate]);

  useEffect(() => {
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
  }, [
    transactionData,
    successStates,
    failStates,
    onSuccess,
    onFailure,
    onFinalized,
  ]);

  const isTerminal =
    transactionData &&
    (successStates.includes(transactionData.status) ||
      failStates.includes(transactionData.status) ||
      transactionData.status === "finalized");

  return {
    isTerminal,
  };
}
