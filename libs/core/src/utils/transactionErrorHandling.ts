export interface TransactionErrorInfo {
  isSimulationError: boolean;
  isDuplicateTransaction: boolean;
  canRecover: boolean;
  retryable: boolean;
  originalError: Error;
}

const SIMULATION_ERROR_PATTERNS = [
  "simulation failed",
  "transaction simulation failed",
];

const DUPLICATE_TRANSACTION_PATTERNS = [
  "already been processed",
  "duplicate transaction",
  "transaction already exists",
];

export function analyzeTransactionError(error: unknown): TransactionErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  const isSimulationError = SIMULATION_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern),
  );

  const isDuplicateTransaction = DUPLICATE_TRANSACTION_PATTERNS.some(
    (pattern) => lowerMessage.includes(pattern),
  );

  const canRecover = isSimulationError && isDuplicateTransaction;
  const retryable = isSimulationError || isDuplicateTransaction;

  return {
    canRecover,
    isDuplicateTransaction,
    isSimulationError,
    originalError: error instanceof Error ? error : new Error(String(error)),
    retryable,
  };
}

export function isLikelyFalsePositive(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as any;
    return orpcError.code === "SIMULATION_ERROR" && orpcError.data?.recoverable;
  }

  const analysis = analyzeTransactionError(error);
  return analysis.canRecover;
}

export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as any;

    switch (orpcError.code) {
      case "NETWORK_ERROR":
        return orpcError.data?.retryable ?? true;
      case "SIMULATION_ERROR":
        return orpcError.data?.recoverable ?? false;
      case "TRANSACTION_FAILED":
        return false;
      case "VALIDATION_ERROR":
        return false;
      case "UNAUTHORIZED":
        return false;
      default:
        return false;
    }
  }

  const analysis = analyzeTransactionError(error);
  return analysis.retryable;
}

export function extractTransactionSignature(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  if ("signature" in error && typeof error.signature === "string") {
    return error.signature;
  }

  if (
    "transaction" in error &&
    error.transaction &&
    typeof error.transaction === "object"
  ) {
    const tx = error.transaction as any;
    if (tx.signature && typeof tx.signature === "string") {
      return tx.signature;
    }
  }

  return null;
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as any;

    switch (orpcError.code) {
      case "SIMULATION_ERROR":
        if (orpcError.data?.recoverable) {
          return "Transaction may have succeeded despite the error message. Please check your wallet balance.";
        }
        return "Transaction simulation failed. Please try again or check your wallet balance.";

      case "TRANSACTION_FAILED":
        return "Transaction failed. Please try again or check your wallet balance.";

      case "VALIDATION_ERROR":
        return `Invalid input: ${orpcError.data?.reason || orpcError.message}`;

      case "NETWORK_ERROR":
        return "Network connection error. Please check your connection and try again.";

      case "UNAUTHORIZED":
        return "Please connect your wallet to continue.";

      default:
        return orpcError.message || "An unknown error occurred.";
    }
  }

  const analysis = analyzeTransactionError(error);

  if (analysis.canRecover) {
    return "Transaction may have succeeded despite the error message. Please check your wallet balance.";
  }

  if (analysis.isSimulationError) {
    return "Transaction simulation failed. Please try again or check your wallet balance.";
  }

  if (analysis.isDuplicateTransaction) {
    return "This transaction appears to have already been processed. Please check your wallet balance.";
  }

  return (
    analysis.originalError.message ||
    "An unknown error occurred during the transaction."
  );
}
