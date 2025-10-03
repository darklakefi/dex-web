export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const errorMessage = error.message;

    if (errorMessage.includes("maximum depth")) {
      return `Account resolution failed: ${errorMessage}. This may be due to circular account dependencies or incorrect PDA derivation.`;
    }

    return errorMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error occurred";
}

export function createTransactionErrorResponse(error: unknown) {
  return {
    error: normalizeErrorMessage(error),
    success: false as const,
    transaction: null,
  };
}
