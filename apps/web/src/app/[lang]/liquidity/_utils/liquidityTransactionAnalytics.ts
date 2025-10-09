export interface TrackLiquidityParams {
  action: "add" | "remove";
  amountA: number;
  amountB: number;
  tokenA: string;
  tokenB: string;
  transactionHash?: string;
  status: "initiated" | "signed" | "submitted" | "confirmed" | "failed";
}

export interface TrackErrorParams {
  context: string;
  error: string;
  details?: unknown;
}

export function trackInitiated(
  trackLiquidity: (params: TrackLiquidityParams) => void,
  params: Omit<TrackLiquidityParams, "status" | "transactionHash">,
) {
  trackLiquidity({ ...params, status: "initiated" });
}

export function trackSigned(
  trackLiquidity: (params: TrackLiquidityParams) => void,
  params: Omit<TrackLiquidityParams, "status" | "transactionHash">,
) {
  trackLiquidity({ ...params, status: "signed" });
}

export function trackConfirmed(
  trackLiquidity: (params: TrackLiquidityParams) => void,
  params: Omit<TrackLiquidityParams, "status" | "action">,
) {
  trackLiquidity({ ...params, action: "add", status: "confirmed" });
}

export function trackLiquidityError(
  trackError: (params: TrackErrorParams) => void,
  error: unknown,
  context: Record<string, unknown>,
) {
  trackError({
    context: "liquidity",
    details: context,
    error: error instanceof Error ? error.message : String(error),
  });
}
