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
  onStatusUpdate?: (status: string, attempt: number) => void;
  onSuccess?: (result: StatusCheckResult<T>) => void;
  onFailure?: (result: StatusCheckResult<T>) => void;
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

          onStatusUpdate?.(result.status, attempt + 1);

          if (successStates.includes(result.status)) {
            onSuccess?.(result);
            return;
          }

          if (failStates.includes(result.status)) {
            onFailure?.(result);
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
              status: "error",
              error: error instanceof Error ? error.message : "Unknown error",
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
