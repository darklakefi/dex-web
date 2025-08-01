"use server";

import type {
  GetQuoteInput,
  GetQuoteOutput,
} from "../../schemas/swaps/getQuote.schema";
import { MAINNET_POOLS, MOCK_POOLS } from "../pools/getPoolDetails.handler";
import { getSwapRateHandler } from "./getSwapRate.handler";

export async function getSwapQuoteHandler(
  input: GetQuoteInput,
): Promise<GetQuoteOutput> {
  const { amountIn, isXtoY, slippage, tokenXMint, tokenYMint } = input;

  const rawData = process.env.NETWORK === "2" ? MOCK_POOLS : MAINNET_POOLS;

  const pool = rawData.find(
    (pool) =>
      (pool.tokenXMint === tokenXMint && pool.tokenYMint === tokenYMint) ||
      (pool.tokenXMint === tokenYMint && pool.tokenYMint === tokenXMint),
  );

  if (!pool) {
    throw new Error("Pool not found");
  }
  console.log("pool", pool);
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
    priceImpactPercentage: 1,
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
