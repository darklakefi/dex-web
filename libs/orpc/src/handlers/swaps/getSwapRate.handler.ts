"use server";

import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  GetSwapRateInput,
  GetSwapRateOutput,
} from "../../schemas/swaps/getSwapRate.schema";
import { getTokenDetailsHandler } from "../tokens/getTokenDetails.handler";

export async function getSwapRateHandler(
  input: GetSwapRateInput,
): Promise<GetSwapRateOutput> {
  const { amountIn, isXtoY, tokenXMint, tokenYMint } = input;

  const helius = getHelius();

  // const pool = await helius.getAcc

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
