"use client";

import { useCallback } from "react";
import {
  TRANSACTION_STEPS,
  TRANSACTION_DESCRIPTIONS,
  SUCCESS_MESSAGES,
  type TransactionType,
} from "../constants/toastMessages";

export type ToastFunction = (options: {
  title: string;
  description: string;
  variant: "loading" | "success" | "error";
  customAction?: React.ReactNode;
}) => void;

export type DismissToastFunction = () => void;

export interface UseTransactionToastsParams {
  toast: ToastFunction;
  dismissToast: DismissToastFunction;
  transactionType: TransactionType;
  isSquadsX?: boolean;
  customMessages?: {
    squadsXSuccess?: {
      title: string;
      description: string;
    };
    squadsXFailure?: {
      title: string;
      description: string;
    };
  };
}

export interface UseTransactionToastsReturn {
  showStepToast: (step: number) => void;
  showSuccessToast: (message?: string, customAction?: React.ReactNode) => void;
  showErrorToast: (
    error: string | Error,
    context?: Record<string, unknown>,
  ) => void;
  showStatusToast: (message: string) => void;
  dismiss: () => void;
}

export const useTransactionToasts = ({
  toast,
  dismissToast,
  transactionType,
  isSquadsX = false,
  customMessages,
}: UseTransactionToastsParams): UseTransactionToastsReturn => {
  const showStepToast = useCallback(
    (step: number) => {
      const stepKey = `STEP_${step}` as keyof typeof TRANSACTION_STEPS;
      const stepData = TRANSACTION_STEPS[stepKey];
      const descriptionData = TRANSACTION_DESCRIPTIONS[stepKey];

      if (stepData && descriptionData) {
        toast({
          title: stepData[transactionType],
          description: descriptionData[transactionType],
          variant: "loading",
        });
      }
    },
    [toast, transactionType],
  );

  const showSuccessToast = useCallback(
    (message?: string, customAction?: React.ReactNode) => {
      if (isSquadsX && customMessages?.squadsXSuccess) {
        toast({
          title: customMessages.squadsXSuccess.title,
          description: customMessages.squadsXSuccess.description,
          variant: "success",
          customAction,
        });
      } else {
        const defaultMessage =
          SUCCESS_MESSAGES[
            transactionType === "SWAP"
              ? "SWAP_COMPLETE"
              : transactionType === "LIQUIDITY"
                ? "LIQUIDITY_ADDED"
                : transactionType === "POOL_CREATION"
                  ? "POOL_CREATED"
                  : "SWAP_COMPLETE"
          ];

        toast({
          title: defaultMessage,
          description: message || "",
          variant: "success",
          customAction,
        });
      }
    },
    [toast, transactionType, isSquadsX, customMessages],
  );

  const showErrorToast = useCallback(
    (error: string | Error, context?: Record<string, unknown>) => {
      const errorMessage = error instanceof Error ? error.message : error;
      const contextString = context
        ? Object.entries(context)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "";

      if (isSquadsX && customMessages?.squadsXFailure) {
        toast({
          title: customMessages.squadsXFailure.title,
          description: customMessages.squadsXFailure.description,
          variant: "error",
        });
      } else {
        toast({
          title: `${transactionType.replace("_", " ")} Error`,
          description: contextString
            ? `${errorMessage}${contextString ? `, ${contextString}` : ""}`
            : errorMessage,
          variant: "error",
        });
      }
    },
    [toast, transactionType, isSquadsX, customMessages],
  );

  const showStatusToast = useCallback(
    (message: string) => {
      toast({
        title: `Checking ${transactionType.toLowerCase()} status`,
        description: message,
        variant: "loading",
      });
    },
    [toast, transactionType],
  );

  const dismiss = useCallback(() => {
    dismissToast();
  }, [dismissToast]);

  return {
    showStepToast,
    showSuccessToast,
    showErrorToast,
    showStatusToast,
    dismiss,
  };
};
