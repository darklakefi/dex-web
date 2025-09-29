import type { TransactionError } from "../_types/liquidity.types";

export class LiquidityError extends Error {
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = "LiquidityError";
    this.context = context;
  }
}

export function createTransactionError(
  error: unknown,
  context?: Record<string, unknown>
): TransactionError {
  const message = error instanceof Error ? error.message : String(error);
  return { message, context };
}

export function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context?: Record<string, unknown>
): Promise<T> {
  return operation().catch((error) => {
    throw new LiquidityError(
      `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
      context
    );
  });
}

export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new LiquidityError(`${fieldName} is required`);
  }
}

export function validateWalletConnection(
  publicKey: unknown,
  walletAdapter: unknown
): void {
  validateRequired(publicKey, "Wallet public key");
  validateRequired((walletAdapter as any)?.wallet, "Wallet adapter");
}