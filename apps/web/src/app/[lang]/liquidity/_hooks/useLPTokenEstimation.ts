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
import { toRawUnitsBigNumberAsBigInt, useDebouncedValue } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
  slippage,
  enabled = true,
}: UseLPTokenEstimationParams): UseLPTokenEstimationResult {
  const debouncedTokenAAmount = useDebouncedValue(tokenAAmount, 500);
  const debouncedTokenBAmount = useDebouncedValue(tokenBAmount, 500);
  const debouncedSlippage = useDebouncedValue(slippage, 500);

  const { tokenXAmount, tokenYAmount, tokenXDecimals, tokenYDecimals } =
    useMemo(() => {
      if (!orderContext) {
        return {
          tokenXAmount: "0",
          tokenXDecimals: 0,
          tokenYAmount: "0",
          tokenYDecimals: 0,
        };
      }

      const isTokenAIsX = orderContext.mapping.tokenAIsX;

      return {
        tokenXAmount: isTokenAIsX
          ? debouncedTokenAAmount
          : debouncedTokenBAmount,
        tokenXDecimals: isTokenAIsX ? tokenADecimals : tokenBDecimals,
        tokenYAmount: isTokenAIsX
          ? debouncedTokenBAmount
          : debouncedTokenAAmount,
        tokenYDecimals: isTokenAIsX ? tokenBDecimals : tokenADecimals,
      };
    }, [
      orderContext,
      debouncedTokenAAmount,
      debouncedTokenBAmount,
      tokenADecimals,
      tokenBDecimals,
    ]);

  const atomicAmounts = useMemo(() => {
    try {
      const tokenXAtomicAmount = toRawUnitsBigNumberAsBigInt(
        Number.parseFloat(tokenXAmount) || 0,
        tokenXDecimals,
      );
      const tokenYAtomicAmount = toRawUnitsBigNumberAsBigInt(
        Number.parseFloat(tokenYAmount) || 0,
        tokenYDecimals,
      );

      const slippageNum = Number.parseFloat(debouncedSlippage) || 0;
      const slippageBasisPoints = Math.round(slippageNum * 100);

      return {
        slippageAtomic: BigInt(slippageBasisPoints),
        tokenXAtomicAmount,
        tokenYAtomicAmount,
      };
    } catch {
      return {
        slippageAtomic: 0n,
        tokenXAtomicAmount: 0n,
        tokenYAtomicAmount: 0n,
      };
    }
  }, [
    tokenXAmount,
    tokenYAmount,
    tokenXDecimals,
    tokenYDecimals,
    debouncedSlippage,
  ]);

  const isQueryEnabled = useMemo(() => {
    if (!enabled || !orderContext) return false;

    const tokenXNum = Number.parseFloat(tokenXAmount);
    const tokenYNum = Number.parseFloat(tokenYAmount);

    const hasValidAmounts =
      !Number.isNaN(tokenXNum) &&
      !Number.isNaN(tokenYNum) &&
      tokenXNum > 0 &&
      tokenYNum > 0;

    return hasValidAmounts;
  }, [enabled, orderContext, tokenXAmount, tokenYAmount]);

  const queryKey = createLPEstimationQueryKey(
    orderContext,
    tokenXAmount,
    tokenYAmount,
    debouncedSlippage,
  );

  const query = useQuery({
    enabled: isQueryEnabled,
    gcTime: 120_000,
    queryFn: async () => {
      if (!orderContext) {
        throw new Error("Token order context is required");
      }

      const response = await tanstackClient.dexGateway.quoteAddLiquidity.query({
        input: {
          $typeName: "darklake.v1.QuoteAddLiquidityRequest",
          slippageTolerance: atomicAmounts.slippageAtomic,
          tokenMintX: orderContext.protocol.tokenX,
          tokenMintY: orderContext.protocol.tokenY,
          tokenXAmount: atomicAmounts.tokenXAtomicAmount,
          tokenYAmount: atomicAmounts.tokenYAtomicAmount,
        },
      });

      return response;
    },
    queryKey,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30_000,
  });

  const data: LPEstimationData | undefined = useMemo(() => {
    if (!query.data) return undefined;

    const lpTokenDecimals = Number(query.data.lpTokenDecimals);
    const lpTokenAmountRaw = query.data.lpTokenAmount;

    const estimatedLPTokens = (
      Number(lpTokenAmountRaw) /
      10 ** lpTokenDecimals
    ).toString();

    return {
      estimatedLPTokens,
      lpTokenAmountRaw,
      lpTokenDecimals,
    };
  }, [query.data]);

  return {
    data,
    error: query.error,
    isEnabled: isQueryEnabled,
    isError: query.isError,
    isLoading: query.isLoading || query.isFetching,
  };
}
