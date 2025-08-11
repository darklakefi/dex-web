import type { Token } from "./token";

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
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  minimalAmountOut: number;
  displayAmountIn: string;
  displayMinimalAmountOut: string;
  status: TradeStatus;
  signature: string;
  createdAt: number;
  isSwapXToY: boolean;
  rate: string;
}
