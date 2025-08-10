import {
  randBetweenDate,
  randBoolean,
  randCurrencySymbol,
  randNumber,
  randUuid,
  seed,
} from "@ngneat/falso";
import type { Swap } from "../../schemas";

export function generateMockSwap(randomSeed: string) {
  seed(randomSeed);

  return {
    buyAmount: randNumber({ max: 1000000, min: 1 }),
    buyBalance: randNumber({ max: 1000000, min: 1 }),
    buyToken: {
      address: randUuid(),
      decimals: randNumber({ max: 1000000, min: 1 }),
      symbol: randCurrencySymbol(),
    },
    estimatedFeesUsd: randNumber({ max: 1000000, min: 1 }),
    exchangeRate: randNumber({ max: 1000000, min: 1 }),
    mevProtectionEnabled: randBoolean(),
    priceImpactPercentage: randNumber({ max: 100, min: 1 }),
    sellAmount: randNumber({ max: 1000000, min: 1 }),
    sellBalance: randNumber({ max: 1000000, min: 1 }),
    sellToken: {
      address: randUuid(),
      decimals: randNumber({ max: 1000000, min: 1 }),
      symbol: randCurrencySymbol(),
    },
    slippageTolerancePercentage: randNumber({ max: 100, min: 1 }),
    swapProgressStep: randNumber({ max: 3, min: 1 }),
    swapStatus: "pending",
    swapType: "swap",
    transactionSignature: randUuid(),
    updatedAt: randBetweenDate({
      from: new Date("2025-01-01"),
      to: new Date("2025-06-24"),
    }).toISOString(),
    userAddress: randUuid(),
  } satisfies Swap;
}
