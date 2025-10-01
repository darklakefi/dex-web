"use client";

import { useCallback } from "react";

export interface StatusCheckResult<T = unknown> {
  status: string;
  data?: T;
  error?: string;
}

export interface UseTransactionStatusConfig<T = unknown> {
  checkStatus: (
    trackingId: string,
    tradeId?: string,
  ) => Promise<StatusCheckResult<T>>;
  successStates: string[];
  failStates: string[];
  maxAttempts?: number;
  retryDelay?: number;
  onStatusUpdate?: (
    status: string,
    attempt: number,
    trackingId?: string,
  ) => void;
  onSuccess?: (result: StatusCheckResult<T>, trackingId?: string) => void;
  onFailure?: (result: StatusCheckResult<T>, trackingId?: string) => void;
  onTimeout?: () => void;
}

export interface UseTransactionStatusReturn {
  checkTransactionStatus: (
    trackingId: string,
    tradeId?: string,
  ) => Promise<void>;
}

export const useTransactionStatus = <T = unknown>({
  checkStatus,
  successStates,
  failStates,
  maxAttempts = 10,
  retryDelay = 2000,
  onStatusUpdate,
  onSuccess,
  onFailure,
  onTimeout,
}: UseTransactionStatusConfig<T>): UseTransactionStatusReturn => {
  const checkTransactionStatus = useCallback(
    async (trackingId: string, tradeId?: string): Promise<void> => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const result = await checkStatus(trackingId, tradeId);

          onStatusUpdate?.(result.status, attempt + 1, trackingId);

          if (successStates.includes(result.status)) {
            onSuccess?.(result, trackingId);
            return;
          }

          if (failStates.includes(result.status)) {
            onFailure?.(result, trackingId);
            return;
          }

          if (attempt < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        } catch (error) {
          console.error(
            `Error checking transaction status (attempt ${attempt + 1}):`,
            error,
          );

          if (attempt === maxAttempts - 1) {
            onFailure?.({
              error: error instanceof Error ? error.message : "Unknown error",
              status: "error",
            });
            return;
          }
        }
      }

      onTimeout?.();
    },
    [
      checkStatus,
      successStates,
      failStates,
      maxAttempts,
      retryDelay,
      onStatusUpdate,
      onSuccess,
      onFailure,
      onTimeout,
    ],
  );

  return {
    checkTransactionStatus,
  };
};
