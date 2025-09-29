export enum LiquidityErrorCode {
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_TOKEN_PAIR = "INVALID_TOKEN_PAIR",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INVALID_PRICE = "INVALID_PRICE",
  MISSING_WALLET = "MISSING_WALLET",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  CALCULATION_FAILED = "CALCULATION_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  USER_REJECTED = "USER_REJECTED",
  SLIPPAGE_ERROR = "SLIPPAGE_ERROR",
  HIGH_SLIPPAGE_WARNING = "HIGH_SLIPPAGE_WARNING",
  IMPERMANENT_LOSS_WARNING = "IMPERMANENT_LOSS_WARNING",
  POOL_NOT_FOUND = "POOL_NOT_FOUND",
  POOL_CREATION_FAILED = "POOL_CREATION_FAILED",
  PRICE_IMPACT_HIGH = "PRICE_IMPACT_HIGH",
  MINIMUM_LIQUIDITY_ERROR = "MINIMUM_LIQUIDITY_ERROR",
  GAS_ESTIMATION_FAILED = "GAS_ESTIMATION_FAILED",
  WALLET_NOT_CONNECTED = "WALLET_NOT_CONNECTED",
  WALLET_CONNECTION_FAILED = "WALLET_CONNECTION_FAILED",
  RPC_ERROR = "RPC_ERROR",
  TRANSACTION_TIMEOUT = "TRANSACTION_TIMEOUT",
  SIGNATURE_VERIFICATION_FAILED = "SIGNATURE_VERIFICATION_FAILED",
  UNKNOWN = "UNKNOWN",
}

export class LiquidityError extends Error {
  constructor(
    message: string,
    public code: LiquidityErrorCode,
    public context?: Record<string, unknown>,
    public retryable: boolean = false,
    public severity: "error" | "warning" | "info" = "error",
    public actionable: boolean = true,
    public transactionHash?: string,
  ) {
    super(message);
    this.name = "LiquidityError";
  }
}

export function toLiquidityError(
  error: unknown,
  context?: Record<string, unknown>,
): LiquidityError {
  if (error instanceof LiquidityError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("insufficient")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.INSUFFICIENT_BALANCE,
        context,
      );
    }

    if (message.includes("rejected") || message.includes("cancelled")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.USER_REJECTED,
        context,
        false,
        "info",
      );
    }

    if (message.includes("slippage") && message.includes("high")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.HIGH_SLIPPAGE_WARNING,
        context,
        false,
        "warning",
      );
    }

    if (message.includes("slippage")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.SLIPPAGE_ERROR,
        context,
        true,
      );
    }

    if (message.includes("pool") && message.includes("not found")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.POOL_NOT_FOUND,
        context,
      );
    }

    if (message.includes("wallet") && message.includes("connect")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.WALLET_NOT_CONNECTED,
        context,
      );
    }

    if (message.includes("rpc") || message.includes("solana")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.RPC_ERROR,
        context,
        true,
      );
    }

    if (message.includes("timeout")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.TRANSACTION_TIMEOUT,
        context,
        true,
      );
    }

    if (message.includes("network") || message.includes("fetch")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.NETWORK_ERROR,
        context,
        true,
      );
    }

    if (message.includes("gas") || message.includes("estimation")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.GAS_ESTIMATION_FAILED,
        context,
        true,
      );
    }

    if (message.includes("signature")) {
      return new LiquidityError(
        error.message,
        LiquidityErrorCode.SIGNATURE_VERIFICATION_FAILED,
        context,
      );
    }

    return new LiquidityError(
      error.message,
      LiquidityErrorCode.UNKNOWN,
      context,
    );
  }

  return new LiquidityError(String(error), LiquidityErrorCode.UNKNOWN, context);
}

export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  errorHandler: (error: LiquidityError) => void,
  context?: Record<string, unknown>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const liquidityError = toLiquidityError(error, context);
    errorHandler(liquidityError);
    throw liquidityError;
  }
}

export function isRetryableError(error: LiquidityError): boolean {
  return (
    error.retryable ||
    [
      LiquidityErrorCode.NETWORK_ERROR,
      LiquidityErrorCode.TIMEOUT,
      LiquidityErrorCode.CALCULATION_FAILED,
      LiquidityErrorCode.RPC_ERROR,
      LiquidityErrorCode.TRANSACTION_TIMEOUT,
      LiquidityErrorCode.GAS_ESTIMATION_FAILED,
      LiquidityErrorCode.SLIPPAGE_ERROR,
    ].includes(error.code)
  );
}

export function getErrorMessage(error: LiquidityError): string {
  const userFriendlyMessages: Record<LiquidityErrorCode, string> = {
    [LiquidityErrorCode.INSUFFICIENT_BALANCE]:
      "Insufficient balance for this transaction",
    [LiquidityErrorCode.INVALID_TOKEN_PAIR]: "Please select different tokens",
    [LiquidityErrorCode.INVALID_AMOUNT]: "Please enter a valid amount",
    [LiquidityErrorCode.INVALID_PRICE]: "Please enter a valid price",
    [LiquidityErrorCode.MISSING_WALLET]: "Please connect your wallet",
    [LiquidityErrorCode.TRANSACTION_FAILED]:
      "Transaction failed. Please try again",
    [LiquidityErrorCode.CALCULATION_FAILED]:
      "Unable to calculate amounts. Please try again",
    [LiquidityErrorCode.NETWORK_ERROR]:
      "Network error. Please check your connection",
    [LiquidityErrorCode.TIMEOUT]: "Request timed out. Please try again",
    [LiquidityErrorCode.USER_REJECTED]: "Transaction was cancelled",
    [LiquidityErrorCode.SLIPPAGE_ERROR]: "Transaction failed due to slippage",
    [LiquidityErrorCode.HIGH_SLIPPAGE_WARNING]:
      "High slippage detected. Your transaction may fail or have unexpected results",
    [LiquidityErrorCode.IMPERMANENT_LOSS_WARNING]:
      "Providing liquidity carries risk of impermanent loss",
    [LiquidityErrorCode.POOL_NOT_FOUND]:
      "Pool not found. You may need to create it first",
    [LiquidityErrorCode.POOL_CREATION_FAILED]:
      "Failed to create pool. Please try again",
    [LiquidityErrorCode.PRICE_IMPACT_HIGH]:
      "Price impact is too high for this transaction",
    [LiquidityErrorCode.MINIMUM_LIQUIDITY_ERROR]:
      "Amount is below minimum liquidity threshold",
    [LiquidityErrorCode.GAS_ESTIMATION_FAILED]:
      "Unable to estimate transaction cost. Please try again",
    [LiquidityErrorCode.WALLET_NOT_CONNECTED]:
      "Please connect your wallet to continue",
    [LiquidityErrorCode.WALLET_CONNECTION_FAILED]:
      "Failed to connect wallet. Please try again",
    [LiquidityErrorCode.RPC_ERROR]:
      "Network connection error. Please try again",
    [LiquidityErrorCode.TRANSACTION_TIMEOUT]:
      "Transaction timed out. Please check your wallet",
    [LiquidityErrorCode.SIGNATURE_VERIFICATION_FAILED]:
      "Failed to verify transaction signature",
    [LiquidityErrorCode.UNKNOWN]: "An unexpected error occurred",
  };

  return userFriendlyMessages[error.code] || error.message;
}

export function getErrorSolution(error: LiquidityError): string {
  const solutions: Record<LiquidityErrorCode, string> = {
    [LiquidityErrorCode.INSUFFICIENT_BALANCE]:
      "Make sure you have enough tokens in your wallet for this transaction plus gas fees",
    [LiquidityErrorCode.INVALID_TOKEN_PAIR]:
      "Try selecting different tokens or check if the tokens are supported",
    [LiquidityErrorCode.INVALID_AMOUNT]:
      "Enter a positive number greater than zero",
    [LiquidityErrorCode.INVALID_PRICE]:
      "Enter a valid price or let the system calculate it automatically",
    [LiquidityErrorCode.MISSING_WALLET]:
      "Connect a supported Solana wallet to continue",
    [LiquidityErrorCode.TRANSACTION_FAILED]:
      "Check your wallet balance and try again with a higher gas fee",
    [LiquidityErrorCode.CALCULATION_FAILED]:
      "Refresh the page and try again, or check if the pool exists",
    [LiquidityErrorCode.NETWORK_ERROR]:
      "Check your internet connection and try again",
    [LiquidityErrorCode.TIMEOUT]:
      "Try again or increase your RPC timeout settings",
    [LiquidityErrorCode.USER_REJECTED]:
      "Approve the transaction in your wallet to continue",
    [LiquidityErrorCode.SLIPPAGE_ERROR]:
      "Try increasing your slippage tolerance or wait for better market conditions",
    [LiquidityErrorCode.HIGH_SLIPPAGE_WARNING]:
      "Consider reducing your trade size or increasing slippage tolerance",
    [LiquidityErrorCode.IMPERMANENT_LOSS_WARNING]:
      "Learn about impermanent loss risks before providing liquidity",
    [LiquidityErrorCode.POOL_NOT_FOUND]:
      "Create the pool first or check if you selected the correct tokens",
    [LiquidityErrorCode.POOL_CREATION_FAILED]:
      "Make sure you have enough SOL for pool creation fees",
    [LiquidityErrorCode.PRICE_IMPACT_HIGH]:
      "Reduce your trade size or wait for better market conditions",
    [LiquidityErrorCode.MINIMUM_LIQUIDITY_ERROR]:
      "Increase the amount to meet minimum requirements",
    [LiquidityErrorCode.GAS_ESTIMATION_FAILED]:
      "Try again or manually set a higher gas limit",
    [LiquidityErrorCode.WALLET_NOT_CONNECTED]:
      "Click the Connect Wallet button and follow the prompts",
    [LiquidityErrorCode.WALLET_CONNECTION_FAILED]:
      "Make sure your wallet extension is enabled and unlocked",
    [LiquidityErrorCode.RPC_ERROR]:
      "Try switching to a different RPC endpoint or wait a moment",
    [LiquidityErrorCode.TRANSACTION_TIMEOUT]:
      "Check your wallet for pending transactions or try again",
    [LiquidityErrorCode.SIGNATURE_VERIFICATION_FAILED]:
      "Try the transaction again or check your wallet settings",
    [LiquidityErrorCode.UNKNOWN]:
      "Try refreshing the page or contact support if the problem persists",
  };

  return (
    solutions[error.code] ||
    "Please try again or contact support if the issue persists"
  );
}
