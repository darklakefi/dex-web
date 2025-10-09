"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";

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
 */
export function useLPTokenEstimation({
  tokenAAddress,
  tokenBAddress,
  tokenAAmount,
  tokenBAmount,
  slippage = "0.5",
  enabled = true,
}: UseLPTokenEstimationParams): any {
  // Pure function call - no useMemo needed for deterministic operations
  const { tokenXAddress: tokenXMint, tokenYAddress: tokenYMint } =
    tokenAAddress && tokenBAddress
      ? sortSolanaAddresses(tokenAAddress, tokenBAddress)
      : { tokenXAddress: "", tokenYAddress: "" };

  // Simple boolean logic - computed inline
  const shouldFetch =
    enabled &&
    tokenAAddress &&
    tokenBAddress &&
    tokenAAmount &&
    tokenBAmount &&
    Number(tokenAAmount) > 0 &&
    Number(tokenBAmount) > 0 &&
    !Number.isNaN(Number(tokenAAmount)) &&
    !Number.isNaN(Number(tokenBAmount));

  // Build query input inline - TanStack Query's queryKey handles stability
  const tokenAIsX = tokenAAddress === tokenXMint;
  const queryInput = shouldFetch
    ? {
        slippage: Number(slippage),
        tokenXAmount: Number(tokenAIsX ? tokenAAmount : tokenBAmount),
        tokenXMint,
        tokenYAmount: Number(tokenAIsX ? tokenBAmount : tokenAAmount),
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
    refetchInterval: 10000, // 5 seconds
    select: (data): LPEstimationData => ({
      estimatedLPTokens: data.estimatedLPTokens,
      // Convert back to number for easier usage
      estimatedLPTokensNumber: Number(data.estimatedLPTokens),
    }), // Refetch every 10 seconds for real-time estimates
    staleTime: 5000,
  });
}
