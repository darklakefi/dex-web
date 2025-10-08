import { toast } from "../../../_utils/toast";

export interface ShowErrorToastParams {
  message: string;
  context?: Record<string, unknown>;
}

export interface ShowInfoToastParams {
  message: string;
  context?: Record<string, unknown>;
}

export function showErrorToast({ message, context }: ShowErrorToastParams) {
  toast.error(message, context);
}

export function showInfoToast({ message, context }: ShowInfoToastParams) {
  toast.info(message, context);
}

export function showStepToast(step: number) {
  toast.step(step);
}
