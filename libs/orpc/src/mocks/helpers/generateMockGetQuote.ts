import {
  randBoolean,
  randCurrencySymbol,
  randNumber,
  randUuid,
  seed,
} from "@ngneat/falso";
import type { GetQuoteOutput } from "../../schemas/swaps/getQuote.schema";

export function generateMockGetQuote(randomSeed: string) {
  seed(randomSeed);

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
