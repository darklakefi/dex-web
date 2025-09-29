export interface SwapTrackingParams {
  fromAmount: number;
  fromToken: string;
  toAmount: number;
  toToken: string;
  transactionHash?: string;
}

export interface LiquidityTrackingParams {
  action: "add" | "remove";
  amountA: number;
  amountB: number;
  tokenA: string;
  tokenB: string;
  transactionHash?: string;
}

export interface ErrorTrackingParams {
  context: string;
  error: string;
  details?: Record<string, unknown>;
}

export type TransactionStatus = "initiated" | "signed" | "submitted" | "confirmed" | "failed";

export interface TransactionTracker<T> {
  trackInitiated: (params: T) => void;
  trackSigned: (params: T) => void;
  trackSubmitted: (params: T) => void;
  trackConfirmed: (params: T) => void;
  trackFailed: (params: T) => void;
}

export const createSwapTracker = (
  trackSwap: (params: SwapTrackingParams & { status: TransactionStatus }) => void
): TransactionTracker<SwapTrackingParams> => ({
  trackInitiated: (params) => trackSwap({ ...params, status: "initiated" }),
  trackSigned: (params) => trackSwap({ ...params, status: "signed" }),
  trackSubmitted: (params) => trackSwap({ ...params, status: "submitted" }),
  trackConfirmed: (params) => trackSwap({ ...params, status: "confirmed" }),
  trackFailed: (params) => trackSwap({ ...params, status: "failed" }),
});

export const createLiquidityTracker = (
  trackLiquidity: (params: LiquidityTrackingParams & { status: TransactionStatus }) => void
): TransactionTracker<LiquidityTrackingParams> => ({
  trackInitiated: (params) => trackLiquidity({ ...params, status: "initiated" }),
  trackSigned: (params) => trackLiquidity({ ...params, status: "signed" }),
  trackSubmitted: (params) => trackLiquidity({ ...params, status: "submitted" }),
  trackConfirmed: (params) => trackLiquidity({ ...params, status: "confirmed" }),
  trackFailed: (params) => trackLiquidity({ ...params, status: "failed" }),
});

export const standardizeErrorTracking = (
  trackError: (params: ErrorTrackingParams) => void,
  context: string
) => (error: unknown, details?: Record<string, unknown>) => {
  trackError({
    context,
    error: error instanceof Error ? error.message : "Unknown error",
    details,
  });
};