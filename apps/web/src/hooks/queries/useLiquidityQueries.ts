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
import { usePageVisibility } from "../usePageVisibility";

interface UserLiquidityQueryOptions
  extends Pick<UseQueryOptions<GetUserLiquidityOutput>, "enabled"> {
  isActivelyTrading?: boolean;
}

interface AddLiquidityReviewQueryOptions
  extends Pick<UseQueryOptions<GetAddLiquidityReviewOutput>, "enabled"> {}

export function useUserLiquidity(
  ownerAddress: string,
  tokenXMint: string,
  tokenYMint: string,
  options?: UserLiquidityQueryOptions,
): UseQueryResult<GetUserLiquidityOutput> {
  const isVisible = usePageVisibility();
  const pollingInterval = options?.isActivelyTrading ? 2000 : 10000;

  return useQuery({
    ...tanstackClient.liquidity.getUserLiquidity.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: { ownerAddress, tokenXMint, tokenYMint },
    }),
    enabled: !!ownerAddress && !!tokenXMint && !!tokenYMint,
    refetchInterval: isVisible ? pollingInterval : false,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: pollingInterval,
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
    staleTime: 5000,
    ...options,
  });
}
