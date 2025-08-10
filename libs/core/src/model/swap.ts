export enum TradeStatus {
  UNSIGNED = "UNSIGNED",
  SIGNED = "SIGNED",
  CONFIRMED = "CONFIRMED",
  SETTLED = "SETTLED",
  SLASHED = "SLASHED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export interface SwapTransaction {
  tradeId: string;
  orderId: string;
  userAddress: string;
  tokenMintX: string;
  tokenMintY: string;
  amountIn: number;
  minimalAmountOut: number;
  displayAmountIn: string;
  displayMinimalAmountOut: string;
  status: TradeStatus;
  signature: string;
  createdAt: number;
  updatedAt: number;
}
