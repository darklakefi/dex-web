"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetQuoteOutput,
  GetSwapDetailsOutput,
} from "@dex-web/orpc/schemas";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

export function useSwapQuote(
  tokenXMint: string,
  tokenYMint: string,
  amountIn: number,
  isSwapXToY: boolean,
  slippage: number = 0.5,
  options?: { enabled?: boolean },
): UseQueryResult<GetQuoteOutput> {
  return useQuery({
    ...tanstackClient.swap.getSwapQuote.queryOptions({
      input: {
        amountIn,
        isXtoY: isSwapXToY,
        slippage,
        tokenXMint,
        tokenYMint,
      },
      ...options,
    }),
    queryKey: queryKeys.swap.quote(
      tokenXMint,
      tokenYMint,
      amountIn,
      isSwapXToY,
    ),
  });
}

export function useSwapQuoteSuspense(
  tokenXMint: string,
  tokenYMint: string,
  amountIn: number,
  isSwapXToY: boolean,
  slippage: number = 0.5,
): UseSuspenseQueryResult<GetQuoteOutput> {
  return useSuspenseQuery({
    ...tanstackClient.swap.getSwapQuote.queryOptions({
      input: {
        amountIn,
        isXtoY: isSwapXToY,
        slippage,
        tokenXMint,
        tokenYMint,
      },
    }),
    queryKey: queryKeys.swap.quote(
      tokenXMint,
      tokenYMint,
      amountIn,
      isSwapXToY,
    ),
  });
}

export function useSwapDetails(
  swapId: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetSwapDetailsOutput> {
  return useQuery({
    ...tanstackClient.swap.getSwapDetails.queryOptions({
      input: { swapId },
      ...options,
    }),
    queryKey: [...queryKeys.swap.all, "details", swapId],
  });
}
