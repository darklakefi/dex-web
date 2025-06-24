import {
  randBoolean,
  randCurrencySymbol,
  randNumber,
  randUuid,
  seed,
} from "@ngneat/falso";
import type { Swap } from "../../schemas/swaps/swap.schema";

export function generateMockSwap(swapId: string = randUuid()) {
  seed(swapId);
  return {
    buyAmount: randNumber({ max: 1000000, min: 1 }),
    buyBalance: randNumber({ max: 1000000, min: 1 }),
    buyToken: {
      address: randUuid(),
      symbol: randCurrencySymbol(),
      value: randNumber({ max: 1000000, min: 1 }).toString(),
    },
    estimatedFeesUsd: randNumber({ max: 1000000, min: 1 }),
    exchangeRate: randNumber({ max: 1000000, min: 1 }),
    mevProtectionEnabled: randBoolean(),
    priceImpactPercentage: randNumber({ max: 100, min: 1 }),
    sellAmount: randNumber({ max: 1000000, min: 1 }),
    sellBalance: randNumber({ max: 1000000, min: 1 }),
    sellToken: {
      address: randUuid(),
      symbol: randCurrencySymbol(),
      value: randNumber({ max: 1000000, min: 1 }).toString(),
    },
    slippageTolerancePercentage: randNumber({ max: 100, min: 1 }),
    swapProgressStep: randNumber({ max: 3, min: 1 }),
    swapStatus: "pending",
    swapType: "swap",
    transactionSignature: randUuid(),
    updatedAt: new Date().toISOString(),
    userAddress: randUuid(),
  } satisfies Swap;
}
