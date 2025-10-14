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
  variant: "loading" | "success" | "error" | "warning" | "info";
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
  showStepToast: (
    step: number,
    params?: { key: string; value: string }[],
  ) => void;
  showSuccessToast: (message?: string, customAction?: React.ReactNode) => void;
  showErrorToast: (
    error: string | Error,
    context?: Record<string, unknown>,
  ) => void;
  showWarningToast: (
    message: string | Error,
    context?: Record<string, unknown>,
  ) => void;
  showInfoToast: (
    message: string | Error,
    context?: Record<string, unknown>,
  ) => void;
  showStatusToast: (message: string) => void;
  dismiss: () => void;
}

const SUBMITTED_TITLES: Record<TransactionType, string> = {
  LIQUIDITY: "Liquidity transaction submitted",
  POOL_CREATION: "Pool creation submitted",
  SWAP: "Swap submitted",
};

export function buildSubmittedToast({
  transactionType,
  signature,
  description,
  title,
}: {
  transactionType: TransactionType;
  signature: string;
  description?: string;
  title?: string;
}) {
  return {
    description:
      description ??
      `Transaction is awaiting confirmation. Transaction: ${signature}`,
    title: title ?? SUBMITTED_TITLES[transactionType],
    variant: "info" as const,
  };
}

export const useTransactionToasts = ({
  toast,
  dismissToast,
  transactionType,
  isSquadsX = false,
  customMessages,
}: UseTransactionToastsParams): UseTransactionToastsReturn => {
  const showStepToast = useCallback(
    (step: number, params?: { key: string; value: string }[]) => {
      const stepKey = `STEP_${step}` as keyof typeof TRANSACTION_STEPS;
      const stepData = TRANSACTION_STEPS[stepKey];
      const descriptionData = TRANSACTION_DESCRIPTIONS[stepKey];

      if (stepData && descriptionData) {
        let title: string = stepData[transactionType];

        if (params && params.length > 0) {
          params.forEach(({ key, value }) => {
            title = title.replace(`{${key}}`, value);
          });
        }

        toast({
          description: descriptionData[transactionType],
          title,
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

  const showInfoToast = useCallback(
    (message: string | Error, context?: Record<string, unknown>) => {
      const infoMessage = message instanceof Error ? message.message : message;
      const contextString = context
        ? Object.entries(context)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "";

      toast({
        description: contextString
          ? `${infoMessage}${contextString ? `, ${contextString}` : ""}`
          : infoMessage,
        title: `${transactionType.replace("_", " ")} Status`,
        variant: "info",
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
    showInfoToast,
    showStatusToast,
    showStepToast,
    showSuccessToast,
    showWarningToast,
  };
};
