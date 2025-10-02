export interface TransactionErrorInfo {
  isSimulationError: boolean;
  isDuplicateTransaction: boolean;
  canRecover: boolean;
  retryable: boolean;
  originalError: Error;
  isSolBalanceError?: boolean;
  isTokenBalanceError?: boolean;
  isComputeError?: boolean;
  isSlippageError?: boolean;
}

const SIMULATION_ERROR_PATTERNS = [
  "simulation failed",
  "transaction simulation failed",
];

const SOL_BALANCE_ERROR_PATTERNS = [
  "insufficient funds",
  "insufficient lamports",
  "insufficient sol",
  "account not found",
];

const TOKEN_BALANCE_ERROR_PATTERNS = [
  "insufficient token balance",
  "token account not found",
  "invalid token account",
];

const COMPUTE_ERROR_PATTERNS = [
  "compute budget exceeded",
  "program failed to complete",
  "out of compute",
];

const SLIPPAGE_ERROR_PATTERNS = [
  "slippage tolerance exceeded",
  "price impact too high",
  "minimum amount not met",
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

  const isSolBalanceError = SOL_BALANCE_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern),
  );

  const isTokenBalanceError = TOKEN_BALANCE_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern),
  );

  const isComputeError = COMPUTE_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern),
  );

  const isSlippageError = SLIPPAGE_ERROR_PATTERNS.some((pattern) =>
    lowerMessage.includes(pattern),
  );

  const canRecover = isSimulationError && isDuplicateTransaction;
  const retryable =
    isSimulationError || isDuplicateTransaction || isComputeError;

  return {
    canRecover,
    isComputeError,
    isDuplicateTransaction,
    isSimulationError,
    isSlippageError,
    isSolBalanceError,
    isTokenBalanceError,
    originalError: error instanceof Error ? error : new Error(String(error)),
    retryable,
  };
}

interface OrpcError {
  code: string;
  message?: string;
  data?: {
    recoverable?: boolean;
    retryable?: boolean;
    reason?: string;
  };
}

interface TransactionObject {
  signature?: string;
}

export function isLikelyFalsePositive(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as OrpcError;
    return (
      orpcError.code === "SIMULATION_ERROR" &&
      (orpcError.data?.recoverable ?? false)
    );
  }

  const analysis = analyzeTransactionError(error);
  return analysis.canRecover;
}

export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as OrpcError;

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
    const tx = error.transaction as TransactionObject;
    if (tx.signature && typeof tx.signature === "string") {
      return tx.signature;
    }
  }

  return null;
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as OrpcError;

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

  if (analysis.isSolBalanceError) {
    return "Insufficient SOL balance for transaction fees. Please add SOL to your wallet and try again.";
  }

  if (analysis.isTokenBalanceError) {
    return "Insufficient token balance or missing token account. Please check your token balances and try again.";
  }

  if (analysis.isComputeError) {
    return "Transaction exceeded compute limits. Please try with a smaller amount or try again later.";
  }

  if (analysis.isSlippageError) {
    return "Transaction failed due to slippage. Please increase your slippage tolerance or try again.";
  }

  if (analysis.isSimulationError) {
    return "Transaction simulation failed. This could be due to insufficient balance, network congestion, or invalid parameters. Please check your wallet balance and try again.";
  }

  if (analysis.isDuplicateTransaction) {
    return "This transaction appears to have already been processed. Please check your wallet balance.";
  }

  return (
    analysis.originalError.message ||
    "An unknown error occurred during the transaction."
  );
}

export function isWarningMessage(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const orpcError = error as OrpcError;

    if (orpcError.code === "SIMULATION_ERROR" && orpcError.data?.recoverable) {
      return true;
    }
  }

  const analysis = analyzeTransactionError(error);

  return analysis.canRecover;
}
