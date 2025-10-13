"use client";

import type { TokenAccountsData } from "@dex-web/core";
import { tanstackClient } from "@dex-web/orpc";
import { shouldUseNativeSolBalance } from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePageVisibility } from "./usePageVisibility";

interface UseRealtimeTokenAccountsParams {
  publicKey: PublicKey | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  hasRecentTransaction?: boolean;
}

export interface UseRealtimeTokenAccountsReturn {
  tokenAAccount: TokenAccountsData | undefined;
  tokenBAccount: TokenAccountsData | undefined;
  refetchTokenAAccount: () => Promise<unknown>;
  refetchTokenBAccount: () => Promise<unknown>;
  isLoadingTokenA: boolean;
  isLoadingTokenB: boolean;
  errorTokenA: Error | null;
  errorTokenB: Error | null;
  isRefreshingTokenA: boolean;
  isRefreshingTokenB: boolean;
  isRealtimeTokenA: boolean;
  isRealtimeTokenB: boolean;
  isRealtime: boolean;
  /** Whether token A uses native SOL balance */
  tokenAUsesNativeSol: boolean;
  /** Whether token B uses native SOL balance */
  tokenBUsesNativeSol: boolean;

  // DEPRECATED - Keep for backwards compatibility (will be removed in future version)
  /** @deprecated Use tokenAAccount instead */
  buyTokenAccount: TokenAccountsData | undefined;
  /** @deprecated Use tokenBAccount instead */
  sellTokenAccount: TokenAccountsData | undefined;
  /** @deprecated Use refetchTokenAAccount instead */
  refetchBuyTokenAccount: () => Promise<unknown>;
  /** @deprecated Use refetchTokenBAccount instead */
  refetchSellTokenAccount: () => Promise<unknown>;
  /** @deprecated Use isLoadingTokenA instead */
  isLoadingBuy: boolean;
  /** @deprecated Use isLoadingTokenB instead */
  isLoadingSell: boolean;
  /** @deprecated Use errorTokenA instead */
  errorBuy: Error | null;
  /** @deprecated Use errorTokenB instead */
  errorSell: Error | null;
  /** @deprecated Use isRefreshingTokenA instead */
  isRefreshingBuy: boolean;
  /** @deprecated Use isRefreshingTokenB instead */
  isRefreshingSell: boolean;
  /** @deprecated Use isRealtimeTokenA instead */
  isRealtimeBuy: boolean;
  /** @deprecated Use isRealtimeTokenB instead */
  isRealtimeSell: boolean;
  /** @deprecated Use tokenAUsesNativeSol instead */
  buyTokenUsesNativeSol: boolean;
  /** @deprecated Use tokenBUsesNativeSol instead */
  sellTokenUsesNativeSol: boolean;
}

/**
 * Fetches token account balances with dynamic polling intervals.
 * Uses TanStack Query v5's keepPreviousData to prevent UI flicker during refetches.
 * Polling interval adapts based on recent transaction activity.
 */
export function useRealtimeTokenAccounts({
  publicKey,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction = false,
}: UseRealtimeTokenAccountsParams): UseRealtimeTokenAccountsReturn {
  const isVisible = usePageVisibility();
  const pollingInterval = hasRecentTransaction ? 3000 : 15000;
  const staleTime = hasRecentTransaction ? 2000 : 10000;

  const tokenAUsesNativeSol = shouldUseNativeSolBalance(tokenAAddress);
  const tokenBUsesNativeSol = shouldUseNativeSolBalance(tokenBAddress);

  const tokenAQuery = useQuery({
    ...tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenAAddress || "",
        ownerAddress: publicKey?.toBase58() || "",
      },
    }),
    enabled: !!publicKey && !!tokenAAddress,
    placeholderData: keepPreviousData,

    refetchInterval: isVisible ? pollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime,
  });

  const tokenBQuery = useQuery({
    ...tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenBAddress || "",
        ownerAddress: publicKey?.toBase58() || "",
      },
    }),
    enabled: !!publicKey && !!tokenBAddress,
    placeholderData: keepPreviousData,

    refetchInterval: isVisible ? pollingInterval : false,
    refetchIntervalInBackground: false,
    staleTime,
  });

  const isRefreshingTokenA = tokenAQuery.isFetching && !tokenAQuery.isPending;
  const isRefreshingTokenB = tokenBQuery.isFetching && !tokenBQuery.isPending;

  return {
    buyTokenAccount: tokenAQuery.data,
    buyTokenUsesNativeSol: tokenAUsesNativeSol,
    errorBuy: tokenAQuery.error,
    errorSell: tokenBQuery.error,
    errorTokenA: tokenAQuery.error,
    errorTokenB: tokenBQuery.error,
    isLoadingBuy: tokenAQuery.isPending,
    isLoadingSell: tokenBQuery.isPending,
    isLoadingTokenA: tokenAQuery.isPending,
    isLoadingTokenB: tokenBQuery.isPending,
    isRealtime: !!publicKey && !!tokenAAddress && !!tokenBAddress,
    isRealtimeBuy: !!publicKey && !!tokenAAddress,
    isRealtimeSell: !!publicKey && !!tokenBAddress,
    isRealtimeTokenA: !!publicKey && !!tokenAAddress,
    isRealtimeTokenB: !!publicKey && !!tokenBAddress,
    isRefreshingBuy: isRefreshingTokenA,
    isRefreshingSell: isRefreshingTokenB,
    isRefreshingTokenA,
    isRefreshingTokenB,
    refetchBuyTokenAccount: tokenAQuery.refetch,
    refetchSellTokenAccount: tokenBQuery.refetch,
    refetchTokenAAccount: tokenAQuery.refetch,
    refetchTokenBAccount: tokenBQuery.refetch,
    sellTokenAccount: tokenBQuery.data,
    sellTokenUsesNativeSol: tokenBUsesNativeSol,

    tokenAAccount: tokenAQuery.data,
    tokenAUsesNativeSol,
    tokenBAccount: tokenBQuery.data,
    tokenBUsesNativeSol,
  };
}
