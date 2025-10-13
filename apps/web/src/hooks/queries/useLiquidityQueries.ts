"use client";

import { tanstackClient } from "@dex-web/orpc";
import type {
  GetAddLiquidityReviewOutput,
  GetUserLiquidityOutput,
} from "@dex-web/orpc/schemas/index";
import {
  type UseQueryOptions,
  type UseQueryResult,
  type UseSuspenseQueryResult,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";

interface UserLiquidityQueryOptions
  extends Pick<UseQueryOptions<GetUserLiquidityOutput>, "enabled"> {}

interface AddLiquidityReviewQueryOptions
  extends Pick<UseQueryOptions<GetAddLiquidityReviewOutput>, "enabled"> {}

export function useUserLiquidity(
  ownerAddress: string,
  tokenXMint: string,
  tokenYMint: string,
  options?: UserLiquidityQueryOptions,
): UseQueryResult<GetUserLiquidityOutput> {
  return useQuery({
    ...tanstackClient.liquidity.getUserLiquidity.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { ownerAddress, tokenXMint, tokenYMint },
    }),
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000,
    ...options,
  });
}

export function useUserLiquiditySuspense(
  ownerAddress: string,
  tokenXMint: string,
  tokenYMint: string,
): UseSuspenseQueryResult<GetUserLiquidityOutput> {
  return useSuspenseQuery({
    ...tanstackClient.liquidity.getUserLiquidity.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { ownerAddress, tokenXMint, tokenYMint },
    }),
  });
}

export function useAddLiquidityReview(
  tokenXMint: string,
  tokenYMint: string,
  tokenAmount: number,
  isTokenX: boolean,
  options?: AddLiquidityReviewQueryOptions,
): UseQueryResult<GetAddLiquidityReviewOutput> {
  return useQuery({
    ...tanstackClient.liquidity.getAddLiquidityReview.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { isTokenX, tokenAmount, tokenXMint, tokenYMint },
    }),
    ...options,
  });
}
