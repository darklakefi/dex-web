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
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
  refetchBuyTokenAccount: () => Promise<unknown>;
  refetchSellTokenAccount: () => Promise<unknown>;
  isLoadingBuy: boolean;
  isLoadingSell: boolean;
  errorBuy: Error | null;
  errorSell: Error | null;
  isRefreshingBuy: boolean;
  isRefreshingSell: boolean;
  isRealtimeBuy: boolean;
  isRealtimeSell: boolean;
  isRealtime: boolean;
  /** Whether buy token uses native SOL balance */
  buyTokenUsesNativeSol: boolean;
  /** Whether sell token uses native SOL balance */
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

  // Determine if tokens use native SOL balance
  const buyTokenUsesNativeSol = shouldUseNativeSolBalance(tokenAAddress);
  const sellTokenUsesNativeSol = shouldUseNativeSolBalance(tokenBAddress);

  const buyQuery = useQuery({
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

  const sellQuery = useQuery({
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

  const isRefreshingBuy = buyQuery.isFetching && !buyQuery.isPending;
  const isRefreshingSell = sellQuery.isFetching && !sellQuery.isPending;

  return {
    buyTokenAccount: buyQuery.data,
    buyTokenUsesNativeSol,
    errorBuy: buyQuery.error,
    errorSell: sellQuery.error,
    isLoadingBuy: buyQuery.isPending,
    isLoadingSell: sellQuery.isPending,
    isRealtime: !!publicKey && !!tokenAAddress && !!tokenBAddress,
    isRealtimeBuy: !!publicKey && !!tokenAAddress,
    isRealtimeSell: !!publicKey && !!tokenBAddress,
    isRefreshingBuy,
    isRefreshingSell,
    refetchBuyTokenAccount: buyQuery.refetch,
    refetchSellTokenAccount: sellQuery.refetch,
    sellTokenAccount: sellQuery.data,
    sellTokenUsesNativeSol,
  };
}
