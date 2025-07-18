import type { Token } from "./token";

export interface SwapTransaction {
  id: string;
  address: string;
  executedAt: Date;
  amountIn: number;
  amountOut: number;
  tokenIn: Token;
  tokenOut: Token;
}
