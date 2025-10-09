import {
  TRANSACTION_DESCRIPTIONS,
  TRANSACTION_STEPS,
} from "../../../../../../../libs/core/src/constants/toastMessages";
import { toast } from "../../../_utils/toast";

export interface ShowErrorToastParams {
  message: string;
}

export interface ShowInfoToastParams {
  message: string;
}

export function showErrorToast({ message }: ShowErrorToastParams) {
  toast({
    description: message,
    title: "Transaction Error",
    variant: "error",
  });
}

export function showInfoToast({ message }: ShowInfoToastParams) {
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
