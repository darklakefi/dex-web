"use client";

import { tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

export function useLPTokenEstimation({
  tokenAAddress,
  tokenBAddress,
  tokenAAmount,
  tokenBAmount,
  slippage = "0.5",
  enabled = true,
}: UseLPTokenEstimationParams) {
  const { tokenXAddress: tokenXMint, tokenYAddress: tokenYMint } =
    useMemo(() => {
      if (!tokenAAddress || !tokenBAddress) {
        return { tokenXAddress: "", tokenYAddress: "" };
      }
      return sortSolanaAddresses(tokenAAddress, tokenBAddress);
    }, [tokenAAddress, tokenBAddress]);

  const shouldFetch = useMemo(() => {
    return (
      enabled &&
      tokenAAddress &&
      tokenBAddress &&
      tokenAAmount &&
      tokenBAmount &&
      Number(tokenAAmount) > 0 &&
      Number(tokenBAmount) > 0 &&
      !Number.isNaN(Number(tokenAAmount)) &&
      !Number.isNaN(Number(tokenBAmount))
    );
  }, [enabled, tokenAAddress, tokenBAddress, tokenAAmount, tokenBAmount]);

  const queryInput = useMemo(() => {
    if (!shouldFetch) return null;

    // Determine which token is X and which is Y based on sorted addresses
    const tokenAIsX = tokenAAddress === tokenXMint;

    return {
      slippage: Number(slippage),
      tokenXAmount: Number(tokenAIsX ? tokenAAmount : tokenBAmount),
      tokenXMint,
      tokenYAmount: Number(tokenAIsX ? tokenBAmount : tokenAAmount),
      tokenYMint,
    };
  }, [
    shouldFetch,
    tokenXMint,
    tokenYMint,
    tokenAAddress,
    tokenAAmount,
    tokenBAmount,
    slippage,
  ]);

  return useQuery({
    ...tanstackClient.pools.getLPRate.queryOptions({
      input: queryInput!,
    }),
    enabled: shouldFetch && queryInput !== null,
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
