import { toast } from "sonner";

export function handleMutationError(error: unknown, context?: string) {
  const errorMessage =
    error instanceof Error ? error.message : "An error occurred";
  toast.error(context ? `${context}: ${errorMessage}` : errorMessage);
}

export function handleMutationSuccess(message: string) {
  toast.success(message);
}

export function createMutationError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
