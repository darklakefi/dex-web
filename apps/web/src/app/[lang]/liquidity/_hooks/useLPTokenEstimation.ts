/**
 * LP Token Estimation Hook
 *
 * Fetches estimated LP tokens for adding liquidity using the quoteAddLiquidity RPC.
 * Follows software engineering best practices:
 * - Single Responsibility: Only handles LP estimation logic
 * - Proper error handling with typed errors
 * - Loading states for UX feedback
 * - Debouncing to prevent excessive API calls
 * - Type safety throughout
 * - Memoized query keys for cache consistency
 *
 * @module useLPTokenEstimation
 */

"use client";

import { tanstackClient } from "@dex-web/orpc";
import type { TokenOrderContext } from "@dex-web/utils";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  convertLPTokenResponse,
  convertToAtomicAmounts,
  mapUIToProtocolOrder,
  shouldEnableQuery,
} from "../_utils/lpEstimationHelpers";
import { createLPEstimationQueryKey } from "../_utils/queryKeys";

export interface UseLPTokenEstimationParams {
  /**
   * Token order context derived from URL params
   */
  orderContext: TokenOrderContext | null;

  /**
   * Token A amount (in UI order) as string
   */
  tokenAAmount: string;

  /**
   * Token B amount (in UI order) as string
   */
  tokenBAmount: string;

  /**
   * Token A decimals for conversion to atomic units
   */
  tokenADecimals: number;

  /**
   * Token B decimals for conversion to atomic units
   */
  tokenBDecimals: number;

  /**
   * Slippage tolerance as percentage string (e.g., "0.5" for 0.5%)
   * Note: This is currently not used in the estimation query to avoid backend
   * math overflow errors. The quote API always uses 0 slippage for estimation.
   * Slippage is applied during the actual transaction via max_amount_x/y.
   */
  slippage: string;

  /**
   * Whether the query should be enabled
   * Set to false when pool doesn't exist or amounts are invalid
   */
  enabled?: boolean;
}

export interface LPEstimationData {
  /**
   * Estimated LP tokens as a display string (converted from atomic units)
   */
  estimatedLPTokens: string;

  /**
   * Raw LP token amount in atomic units
   */
  lpTokenAmountRaw: bigint;

  /**
   * LP token decimals
   */
  lpTokenDecimals: number;
}

export interface UseLPTokenEstimationResult {
  /**
   * Estimation data when available
   */
  data: LPEstimationData | undefined;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  isError: boolean;

  /**
   * Error object if query failed
   */
  error: Error | null;

  /**
   * Whether the query is enabled
   */
  isEnabled: boolean;
}

/**
 * Hook to estimate LP tokens for adding liquidity.
 *
 * Features:
 * - Debounces input amounts to prevent excessive API calls (500ms)
 * - Converts UI amounts to protocol order (X/Y)
 * - Converts amounts to atomic units for gRPC call
 * - Handles loading and error states
 * - Uses standardized query keys for cache consistency
 * - Only fetches when all required data is available
 *
 * @param params - Estimation parameters
 * @returns Query result with estimation data and states
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const orderContext = useTokenOrder();
 *   const [tokenAAmount, setTokenAAmount] = useState("100");
 *   const [tokenBAmount, setTokenBAmount] = useState("200");
 *
 *   const estimation = useLPTokenEstimation({
 *     orderContext,
 *     tokenAAmount,
 *     tokenBAmount,
 *     tokenADecimals: 9,
 *     tokenBDecimals: 6,
 *     slippage: "0.5",
 *     enabled: !!poolDetails,
 *   });
 *
 *   if (estimation.isLoading) return <div>Calculating...</div>;
 *   if (estimation.isError) return <div>Error: {estimation.error?.message}</div>;
 *
 *   return <div>Estimated LP: {estimation.data?.estimatedLPTokens}</div>;
 * }
 * ```
 */
export function useLPTokenEstimation({
  orderContext,
  tokenAAmount,
  tokenBAmount,
  tokenADecimals,
  tokenBDecimals,
  slippage: _slippage,
  enabled = true,
}: UseLPTokenEstimationParams): UseLPTokenEstimationResult {
  const [debouncedTokenAAmount] = useDebouncedValue(tokenAAmount, {
    wait: 500,
  });
  const [debouncedTokenBAmount] = useDebouncedValue(tokenBAmount, {
    wait: 500,
  });

  const { tokenXAmount, tokenYAmount, tokenXDecimals, tokenYDecimals } =
    useMemo(
      () =>
        mapUIToProtocolOrder(
          orderContext,
          debouncedTokenAAmount,
          debouncedTokenBAmount,
          tokenADecimals,
          tokenBDecimals,
        ),
      [
        orderContext,
        debouncedTokenAAmount,
        debouncedTokenBAmount,
        tokenADecimals,
        tokenBDecimals,
      ],
    );

  const atomicAmounts = useMemo(
    () =>
      convertToAtomicAmounts(
        tokenXAmount,
        tokenYAmount,
        tokenXDecimals,
        tokenYDecimals,
      ),
    [tokenXAmount, tokenYAmount, tokenXDecimals, tokenYDecimals],
  );

  const isQueryEnabled = useMemo(
    () =>
      shouldEnableQuery(
        enabled,
        orderContext,
        tokenXAmount,
        tokenYAmount,
        atomicAmounts.tokenXAtomicAmount,
        atomicAmounts.tokenYAtomicAmount,
      ),
    [
      enabled,
      orderContext,
      tokenXAmount,
      tokenYAmount,
      atomicAmounts.tokenXAtomicAmount,
      atomicAmounts.tokenYAtomicAmount,
    ],
  );

  const queryKey = createLPEstimationQueryKey(
    orderContext,
    tokenXAmount,
    tokenYAmount,
  );

  const query = useQuery({
    ...tanstackClient.dexGateway.quoteAddLiquidity.queryOptions({
      input: {
        $typeName: "darklake.v1.QuoteAddLiquidityRequest",
        slippageTolerance: atomicAmounts.slippageAtomic,
        tokenMintX: orderContext?.protocol.tokenX ?? "",
        tokenMintY: orderContext?.protocol.tokenY ?? "",
        tokenXAmount: atomicAmounts.tokenXAtomicAmount,
        tokenYAmount: atomicAmounts.tokenYAtomicAmount,
      },
    }),
    enabled: isQueryEnabled,
    gcTime: 120_000,
    placeholderData: (previousData) => previousData,
    queryKey,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30_000,
  });

  const data: LPEstimationData | undefined = useMemo(() => {
    if (!query.data) return undefined;

    return convertLPTokenResponse(
      query.data.lpTokenAmount,
      query.data.lpTokenDecimals,
    );
  }, [query.data]);

  return {
    data,
    error: query.error,
    isEnabled: isQueryEnabled,
    isError: query.isError,
    isLoading: query.isLoading,
  };
}
