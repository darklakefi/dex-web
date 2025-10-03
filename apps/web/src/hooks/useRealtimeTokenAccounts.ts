"use client";

import {
  type TokenAccountsData,
  type UseTokenAccountsReturn,
  useTokenAccounts,
} from "@dex-web/core";
import { tanstackClient } from "@dex-web/orpc";
import type { PublicKey } from "@solana/web3.js";
import { QueryClient as QueryClientClass } from "@tanstack/react-query";
import { usePollingQuery } from "./usePollingQuery";

interface UseRealtimeTokenAccountsParams {
  publicKey: PublicKey | null;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  hasRecentTransaction?: boolean;
}

export function useRealtimeTokenAccounts({
  publicKey,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction = false,
}: UseRealtimeTokenAccountsParams): UseTokenAccountsReturn & {
  isRefreshingBuy: boolean;
  isRefreshingSell: boolean;
  isRealtimeBuy: boolean;
  isRealtimeSell: boolean;
  isRealtime: boolean;
} {
  const tokenAccountsResult = useTokenAccounts({
    publicKey,
    tanstackClient,
    tokenAAddress,
    tokenBAddress,
  });

  const { data: liveBuyTokenAccount } = usePollingQuery<TokenAccountsData>(
    ["token-accounts-live", publicKey?.toBase58(), tokenAAddress],
    async () => {
      const queryOptions = tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenAAddress || "",
          ownerAddress: publicKey?.toBase58() || "",
        },
      });
      return queryOptions.queryFn({
        client: new QueryClientClass(),
        meta: undefined,
        queryKey: queryOptions.queryKey,
        signal: new AbortController().signal,
      });
    },
    {
      enabled: !!publicKey && !!tokenAAddress,
      placeholderData: (previousData) => previousData,
      pollingInterval: hasRecentTransaction ? 3000 : 15000,
      staleTime: hasRecentTransaction ? 2000 : 30000,
    },
  );

  const { data: liveSellTokenAccount } = usePollingQuery<TokenAccountsData>(
    ["token-accounts-live", publicKey?.toBase58(), tokenBAddress],
    async () => {
      const queryOptions = tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenBAddress || "",
          ownerAddress: publicKey?.toBase58() || "",
        },
      });
      return queryOptions.queryFn({
        client: new QueryClientClass(),
        meta: undefined,
        queryKey: queryOptions.queryKey,
        signal: new AbortController().signal,
      });
    },
    {
      enabled: !!publicKey && !!tokenBAddress,
      placeholderData: (previousData) => previousData,
      pollingInterval: hasRecentTransaction ? 3000 : 15000,
      staleTime: hasRecentTransaction ? 2000 : 30000,
    },
  );

  const isRefreshingBuy =
    tokenAccountsResult.isLoadingBuy && !!tokenAccountsResult.buyTokenAccount;
  const isRefreshingSell =
    tokenAccountsResult.isLoadingSell && !!tokenAccountsResult.sellTokenAccount;

  return {
    buyTokenAccount: liveBuyTokenAccount || tokenAccountsResult.buyTokenAccount,
    errorBuy: tokenAccountsResult.errorBuy,
    errorSell: tokenAccountsResult.errorSell,
    isLoadingBuy: tokenAccountsResult.isLoadingBuy,
    isLoadingSell: tokenAccountsResult.isLoadingSell,
    isRealtime: !!publicKey && !!tokenAAddress && !!tokenBAddress,
    isRealtimeBuy: !!publicKey && !!tokenAAddress,
    isRealtimeSell: !!publicKey && !!tokenBAddress,
    isRefreshingBuy,
    isRefreshingSell,
    refetchBuyTokenAccount: tokenAccountsResult.refetchBuyTokenAccount,
    refetchSellTokenAccount: tokenAccountsResult.refetchSellTokenAccount,
    sellTokenAccount:
      liveSellTokenAccount || tokenAccountsResult.sellTokenAccount,
  };
}
