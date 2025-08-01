"use server";

import BigNumber from "bignumber.js";
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
  console.log("swapRate", swapRate);
  const mockSolPrice = 200;
  return {
    amountIn,
    amountInRaw: swapRate.amountInRaw,
    amountOut: swapRate.amountOut,
    amountOutRaw: swapRate.amountOutRaw,
    estimatedFee: swapRate.estimatedFee,
    estimatedFeesUsd: BigNumber(swapRate.estimatedFee)
      .div(10 ** 9)
      .multipliedBy(mockSolPrice)
      .toNumber(),
    isXtoY,
    priceImpactPercentage: 1,
    rateXtoY: swapRate.rateXtoY,
    routePlan: [
      {
        amountIn,
        amountOut: swapRate.amountOut,
        feeAmount: 0,
        tokenXMint,
        tokenYMint,
      },
    ],
    slippage: slippage ?? 0,
    tokenX: swapRate.tokenX,
    tokenXMint,
    tokenY: swapRate.tokenY,
    tokenYMint,
  };
}
