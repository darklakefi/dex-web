"use server";

import BigNumber from "bignumber.js";
import type {
  GetQuoteInput,
  GetQuoteOutput,
} from "../../schemas/swaps/getQuote.schema";
import { getTokenDetailsHandler } from "../tokens/getTokenDetails.handler";

const MOCK_POOLS = [
  {
    rateXtoY: 0.01,
    tokenXMint: "DPFczWRUhvXK3F3kZ3qFiQCcoFjo7VHEjL6RK5wKEiVx",
    tokenYMint: "EipJWba86jgVAvZQNBzkLoCzzpf73y3qecDQoNxBN9MM",
  },
];

export async function getSwapQuoteHandler(
  input: GetQuoteInput,
): Promise<GetQuoteOutput> {
  const { amountIn, isXtoY, slippage, tokenXMint, tokenYMint } = input;

  const pool = MOCK_POOLS.find(
    (pool) =>
      (pool.tokenXMint === tokenXMint && pool.tokenYMint === tokenYMint) ||
      (pool.tokenXMint === tokenYMint && pool.tokenYMint === tokenXMint),
  );

  if (!pool) {
    throw new Error("Pool not found");
  }

  const tokenX = await getTokenDetailsHandler({
    address: tokenXMint as string,
  });
  const tokenY = await getTokenDetailsHandler({
    address: tokenYMint as string,
  });

  const amountInBigDecimal = BigNumber(amountIn).multipliedBy(
    BigNumber(10 ** tokenX.decimals),
  );
  const amountOutBigDecimal = isXtoY
    ? amountInBigDecimal.multipliedBy(BigNumber(pool.rateXtoY))
    : amountInBigDecimal.dividedBy(BigNumber(pool.rateXtoY));

  const amountOut = amountOutBigDecimal
    .dividedBy(BigNumber(10 ** tokenY.decimals))
    .toNumber();

  return {
    amountIn,
    amountInRaw: amountInBigDecimal.toNumber(),
    amountOut,
    amountOutRaw: amountOutBigDecimal.toNumber(),
    estimatedFee: 0,
    estimatedFeesUsd: 0,
    isXtoY,
    priceImpactPercentage: 1,
    rateXtoY: pool.rateXtoY,
    routePlan: [
      {
        amountIn,
        amountOut,
        feeAmount: 0,
        tokenXMint,
        tokenYMint,
      },
    ],
    slippage: slippage ?? 0,
    tokenXMint,
    tokenYMint,
  };
}
