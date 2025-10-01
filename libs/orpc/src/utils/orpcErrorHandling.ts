import { analyzeTransactionError } from "@dex-web/core";
import { ORPCError } from "@orpc/server";

export function handleTransactionError(error: unknown, context: string): never {
  console.error(`Error in ${context}:`, error);

  const errorAnalysis = analyzeTransactionError(error);

  if (errorAnalysis.canRecover) {
    throw new ORPCError("SIMULATION_ERROR", {
      data: {
        originalError: errorAnalysis.originalError.message,
        recoverable: true,
      },
      message: "Transaction simulation failed but may have succeeded",
    });
  }

  if (errorAnalysis.isSimulationError) {
    throw new ORPCError("SIMULATION_ERROR", {
      data: {
        originalError: errorAnalysis.originalError.message,
        recoverable: false,
      },
      message: "Transaction simulation failed",
    });
  }

  if (errorAnalysis.isDuplicateTransaction) {
    throw new ORPCError("TRANSACTION_FAILED", {
      data: {
        errorCode: errorAnalysis.originalError.message,
      },
      message: "Transaction appears to have already been processed",
    });
  }

  throw new ORPCError("TRANSACTION_FAILED", {
    data: {
      errorCode: errorAnalysis.originalError.message,
    },
    message: "Transaction failed",
  });
}

export function handleValidationError(field: string, reason: string): never {
  throw new ORPCError("VALIDATION_ERROR", {
    data: {
      field,
      reason,
    },
    message: `Invalid ${field}`,
  });
}

export function handleNetworkError(
  message: string,
  retryable: boolean = true,
): never {
  throw new ORPCError("NETWORK_ERROR", {
    data: {
      retryable,
    },
    message,
  });
}
