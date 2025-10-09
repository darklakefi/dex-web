import {
  TRANSACTION_DESCRIPTIONS,
  TRANSACTION_STEPS,
} from "../../../../../../../libs/core/src/constants/toastMessages";
import { toast } from "../../../_utils/toast";

export interface ShowErrorToastParams {
  message: string;
  context?: Record<string, unknown>;
}

export interface ShowInfoToastParams {
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Shows an error toast notification.
 * @param message - The error message to display
 * @param _context - Optional context for logging/tracking (reserved for future use)
 */
export function showErrorToast({
  message,
  context: _context,
}: ShowErrorToastParams) {
  toast({
    description: message,
    title: "Transaction Error",
    variant: "error",
  });
}

/**
 * Shows an info toast notification.
 * @param message - The info message to display
 * @param _context - Optional context for logging/tracking (reserved for future use)
 */
export function showInfoToast({
  message,
  context: _context,
}: ShowInfoToastParams) {
  toast({
    description: message,
    title: "Transaction Info",
    variant: "info",
  });
}

export function showStepToast(step: number) {
  const stepKey = `STEP_${step}` as keyof typeof TRANSACTION_STEPS;
  const stepData = TRANSACTION_STEPS[stepKey];
  const descriptionData = TRANSACTION_DESCRIPTIONS[stepKey];

  if (stepData && descriptionData) {
    toast({
      description: descriptionData.LIQUIDITY,
      title: stepData.LIQUIDITY,
      variant: "loading",
    });
  }
}
