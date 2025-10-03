"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetAddLiquidityReviewOutput,
  GetUserLiquidityOutput,
} from "@dex-web/orpc/schemas";
import {
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

export function useUserLiquidity(
  ownerAddress: string,
  tokenXMint: string,
  tokenYMint: string,
  options?: { enabled?: boolean },
): UseQueryResult<GetUserLiquidityOutput> {
  return useQuery({
    ...tanstackClient.liquidity.getUserLiquidity.queryOptions({
      input: { ownerAddress, tokenXMint, tokenYMint },
      ...options,
    }),
    queryKey: queryKeys.liquidity.user(ownerAddress, tokenXMint, tokenYMint),
  });
}

export function useUserLiquiditySuspense(
  ownerAddress: string,
  tokenXMint: string,
  tokenYMint: string,
): UseSuspenseQueryResult<GetUserLiquidityOutput> {
  return useSuspenseQuery({
    ...tanstackClient.liquidity.getUserLiquidity.queryOptions({
      input: { ownerAddress, tokenXMint, tokenYMint },
    }),
    queryKey: queryKeys.liquidity.user(ownerAddress, tokenXMint, tokenYMint),
  });
}

export function useAddLiquidityReview(
  tokenXMint: string,
  tokenYMint: string,
  tokenAmount: number,
  isTokenX: boolean,
  options?: { enabled?: boolean },
): UseQueryResult<GetAddLiquidityReviewOutput> {
  return useQuery({
    ...tanstackClient.liquidity.getAddLiquidityReview.queryOptions({
      input: { isTokenX, tokenAmount, tokenXMint, tokenYMint },
      ...options,
    }),
    queryKey: queryKeys.liquidity.review(
      tokenXMint,
      tokenYMint,
      tokenAmount,
      isTokenX ? 1 : 0,
    ),
  });
}
