"use client";

import { useCallback } from "react";
import {
  SUCCESS_MESSAGES,
  TRANSACTION_DESCRIPTIONS,
  TRANSACTION_STEPS,
  type TransactionType,
} from "../constants/toastMessages";

export type ToastFunction = (options: {
  title: string;
  description: string;
  variant: "loading" | "success" | "error" | "warning";
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
  showWarningToast: (
    message: string | Error,
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
          description: descriptionData[transactionType],
          title: stepData[transactionType],
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
          customAction,
          description: customMessages.squadsXSuccess.description,
          title: customMessages.squadsXSuccess.title,
          variant: "success",
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
          customAction,
          description: message || "",
          title: defaultMessage,
          variant: "success",
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
          description: customMessages.squadsXFailure.description,
          title: customMessages.squadsXFailure.title,
          variant: "error",
        });
      } else {
        toast({
          description: contextString
            ? `${errorMessage}${contextString ? `, ${contextString}` : ""}`
            : errorMessage,
          title: `${transactionType.replace("_", " ")} Error`,
          variant: "error",
        });
      }
    },
    [toast, transactionType, isSquadsX, customMessages],
  );

  const showWarningToast = useCallback(
    (message: string | Error, context?: Record<string, unknown>) => {
      const warningMessage =
        message instanceof Error ? message.message : message;
      const contextString = context
        ? Object.entries(context)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "";

      toast({
        description: contextString
          ? `${warningMessage}${contextString ? `, ${contextString}` : ""}`
          : warningMessage,
        title: `${transactionType.replace("_", " ")} Warning`,
        variant: "warning",
      });
    },
    [toast, transactionType],
  );

  const showStatusToast = useCallback(
    (message: string) => {
      toast({
        description: message,
        title: `Checking ${transactionType.toLowerCase()} status`,
        variant: "loading",
      });
    },
    [toast, transactionType],
  );

  const dismiss = useCallback(() => {
    dismissToast();
  }, [dismissToast]);

  return {
    dismiss,
    showErrorToast,
    showStatusToast,
    showStepToast,
    showSuccessToast,
    showWarningToast,
  };
};
