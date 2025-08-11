"use server";

import type {
  GetQuoteInput,
  GetQuoteOutput,
} from "../../schemas/swaps/getQuote.schema";
import { getSwapRateHandler } from "./getSwapRate.handler";

export async function getSwapQuoteHandler(
  input: GetQuoteInput,
): Promise<GetQuoteOutput> {
  const { amountIn, isXtoY, slippage, tokenXMint, tokenYMint } = input;

  const swapRate = await getSwapRateHandler({
    amountIn,
    isXtoY,
    tokenXMint,
    tokenYMint,
  });
  return {
    amountIn,
    amountInRaw: swapRate.amountInRaw,
    amountOut: swapRate.amountOut,
    amountOutRaw: swapRate.amountOutRaw,
    estimatedFee: swapRate.estimatedFee,
    estimatedFeesUsd: swapRate.estimatedFee,
    isXtoY,
    priceImpactPercentage: swapRate.priceImpact,
    rate: swapRate.rate,
    routePlan: [
      {
        amountIn,
        amountOut: swapRate.amountOut,
        feeAmount: 0,
        tokenXMint,
        tokenYMint,
      },
    ],
    slippage,
    tokenX: swapRate.tokenX,
    tokenXMint,
    tokenY: swapRate.tokenY,
    tokenYMint,
  };
}
