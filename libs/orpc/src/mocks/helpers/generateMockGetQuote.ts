import {
  randBoolean,
  randCurrencySymbol,
  randNumber,
  randUuid,
  seed,
} from "@ngneat/falso";
import type {
  GetQuoteInput,
  GetQuoteOutput,
} from "../../schemas/swaps/getQuote.schema";

export function generateMockGetQuote(input: GetQuoteInput) {
  seed(
    `${input.amountIn.toString()}${input.isXtoY.toString()}${input.slippage.toString()}${input.tokenX}${input.tokenY}${input.poolAddress}`,
  );

  return {
    amountOut: randNumber({ max: 1000000, min: 1 }),
    deadline: randNumber({ max: 1000000, min: 1 }),
    estimatedFee: randNumber({ max: 1000000, min: 1 }),
    estimatedFeesUsd: randNumber({ max: 1000000, min: 1 }),
    isXtoY: randBoolean(),
    poolAddress: randUuid(),
    priceImpactPercentage: randNumber({ max: 100, min: 1 }),
    rateXtoY: randNumber({ max: 1000000, min: 1 }),
    slippage: randNumber({ max: 100, min: 1 }),
    tokenX: {
      address: randUuid(),
      symbol: randCurrencySymbol(),
      value: randNumber({ max: 1000000, min: 1 }).toString(),
    },
    tokenY: {
      address: randUuid(),
      symbol: randCurrencySymbol(),
      value: randNumber({ max: 1000000, min: 1 }).toString(),
    },
    userAddress: randUuid(),
  } satisfies GetQuoteOutput;
}
