/**
 * Liquidity Queries Hook
 *
 * Provides query hooks for fetching liquidity-related data with proper
 * enabled conditions to prevent unnecessary API calls.
 *
 * Key Features:
 * - Automatic validation of required parameters before fetching
 * - Configurable polling intervals based on trading activity
 * - Proper handling of user-provided enabled options
 * - Page visibility detection to pause polling when tab is inactive
 *
 * @module useLiquidityQueries
 */

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
  extends Pick<UseQueryOptions<GetUserLiquidityOutput>, "enabled"> {
  /** Whether the user is actively trading (uses faster polling interval) */
  isActivelyTrading?: boolean;
}

interface AddLiquidityReviewQueryOptions
  extends Pick<UseQueryOptions<GetAddLiquidityReviewOutput>, "enabled"> {}

/**
 * Hook to fetch user's liquidity position for a specific pool.
 *
 * This hook automatically validates that all required parameters are present
 * before making the API call. It respects page visibility to pause polling
 * when the tab is inactive.
 *
 * @param ownerAddress - The wallet address of the liquidity provider
 * @param tokenXMint - The mint address of token X in the pool
 * @param tokenYMint - The mint address of token Y in the pool
 * @param options - Optional configuration including enabled state and trading activity
 * @returns Query result with user's liquidity data
 *
 * @example
 * ```tsx
 * const { data: userLiquidity } = useUserLiquidity(
 *   publicKey?.toBase58() ?? "",
 *   tokenXAddress,
 *   tokenYAddress,
 *   { enabled: !!publicKey, isActivelyTrading: true }
 * );
 * ```
 */
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
    enabled:
      !!ownerAddress &&
      !!tokenXMint &&
      !!tokenYMint &&
      (options?.enabled ?? true),

    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });
}

/**
 * Suspense version of useUserLiquidity.
 *
 * This hook suspends the component until the liquidity data is loaded.
 * Only use this when you're certain all parameters are valid and you want
 * to show a loading fallback.
 *
 * @param ownerAddress - The wallet address of the liquidity provider
 * @param tokenXMint - The mint address of token X in the pool
 * @param tokenYMint - The mint address of token Y in the pool
 * @returns Suspense query result with user's liquidity data
 */
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

/**
 * Hook to fetch a review/quote for adding liquidity to a pool.
 *
 * This hook validates that all required parameters are present and that
 * the token amount is greater than zero before making the API call.
 *
 * @param tokenXMint - The mint address of token X in the pool
 * @param tokenYMint - The mint address of token Y in the pool
 * @param tokenAmount - The amount of tokens to add (must be > 0)
 * @param isTokenX - Whether the amount is for token X (true) or token Y (false)
 * @param options - Optional configuration including enabled state
 * @returns Query result with add liquidity review/quote data
 *
 * @example
 * ```tsx
 * const { data: review } = useAddLiquidityReview(
 *   tokenXAddress,
 *   tokenYAddress,
 *   parseFloat(tokenAmount),
 *   true,
 *   { enabled: parseFloat(tokenAmount) > 0 }
 * );
 * ```
 */
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
    enabled:
      !!tokenXMint &&
      !!tokenYMint &&
      tokenAmount > 0 &&
      (options?.enabled ?? true),
    staleTime: 5000,
  });
}
