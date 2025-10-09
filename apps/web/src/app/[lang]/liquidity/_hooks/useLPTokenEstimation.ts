"use client";

import { tanstackClient } from "@dex-web/orpc";
import { mapAmountsToProtocol } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import { useTokenOrder } from "./useTokenOrder";

interface LPEstimationData {
  estimatedLPTokens: string | undefined;
  estimatedLPTokensNumber: number;
}

interface UseLPTokenEstimationParams {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  tokenAAmount: string;
  tokenBAmount: string;
  slippage?: string;
  enabled?: boolean;
}

/**
 * Hook to estimate LP tokens for a liquidity position.
 *
 * Following Answer #5: Only use useMemo for necessary memoization.
 * Simple derivations are computed inline - React Query handles the expensive parts.
 *
 * Token ordering: Uses useTokenOrder to get sorted addresses from URL params.
 * Amounts are mapped to protocol order using the pure mapAmountsToProtocol function.
 */
export function useLPTokenEstimation({
  tokenAAddress,
  tokenBAddress,
  tokenAAmount,
  tokenBAmount,
  slippage = "0.5",
  enabled = true,
}: UseLPTokenEstimationParams): any {
  const orderContext = useTokenOrder();

  const tokenXMint = orderContext?.protocol.tokenX || "";
  const tokenYMint = orderContext?.protocol.tokenY || "";

  const shouldFetch =
    enabled &&
    orderContext &&
    tokenAAddress &&
    tokenBAddress &&
    tokenAAmount &&
    tokenBAmount &&
    Number(tokenAAmount) > 0 &&
    Number(tokenBAmount) > 0 &&
    !Number.isNaN(Number(tokenAAmount)) &&
    !Number.isNaN(Number(tokenBAmount));

  const protocolAmounts =
    orderContext && shouldFetch
      ? mapAmountsToProtocol(
          {
            amountA: tokenAAmount,
            amountB: tokenBAmount,
            tokenA: orderContext.ui.tokenA,
            tokenB: orderContext.ui.tokenB,
          },
          orderContext,
        )
      : null;

  const queryInput =
    shouldFetch && protocolAmounts
      ? {
          slippage: Number(slippage),
          tokenXAmount: Number(protocolAmounts.amountX),
          tokenXMint,
          tokenYAmount: Number(protocolAmounts.amountY),
          tokenYMint,
        }
      : null;

  return useQuery({
    ...tanstackClient.pools.getLPRate.queryOptions({
      input: queryInput!,
    }),
    enabled: Boolean(shouldFetch && queryInput !== null),
    queryKey: [
      "lp-estimation",
      tokenXMint,
      tokenYMint,
      queryInput?.tokenXAmount,
      queryInput?.tokenYAmount,
      queryInput?.slippage,
    ],
    refetchInterval: 10000,
    select: (data): LPEstimationData => ({
      estimatedLPTokens: data.estimatedLPTokens,
      estimatedLPTokensNumber: Number(data.estimatedLPTokens),
    }),
    staleTime: 5000,
  });
}
