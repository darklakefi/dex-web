"use client";

import { useTokenAccounts, type UseTokenAccountsReturn, type TokenAccountsData } from "@dex-web/core";
import type { PublicKey } from "@solana/web3.js";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { tanstackClient } from "@dex-web/orpc";
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
    (context: QueryFunctionContext) => tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenAAddress || "",
        ownerAddress: publicKey?.toBase58() || "",
      },
    }).queryFn(context),
    {
      pollingInterval: hasRecentTransaction ? 3000 : 15000,
      enabled: !!publicKey && !!tokenAAddress,
      staleTime: hasRecentTransaction ? 2000 : 12000,
    }
  );

  const { data: liveSellTokenAccount } = usePollingQuery<TokenAccountsData>(
    ["token-accounts-live", publicKey?.toBase58(), tokenBAddress],
    (context: QueryFunctionContext) => tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenBAddress || "",
        ownerAddress: publicKey?.toBase58() || "",
      },
    }).queryFn(context),
    {
      pollingInterval: hasRecentTransaction ? 3000 : 15000,
      enabled: !!publicKey && !!tokenBAddress,
      staleTime: hasRecentTransaction ? 2000 : 12000,
    }
  );

  const isRefreshingBuy = tokenAccountsResult.isLoadingBuy && !!tokenAccountsResult.buyTokenAccount;
  const isRefreshingSell = tokenAccountsResult.isLoadingSell && !!tokenAccountsResult.sellTokenAccount;

  return {
    buyTokenAccount: liveBuyTokenAccount || tokenAccountsResult.buyTokenAccount,
    sellTokenAccount: liveSellTokenAccount || tokenAccountsResult.sellTokenAccount,
    refetchBuyTokenAccount: tokenAccountsResult.refetchBuyTokenAccount,
    refetchSellTokenAccount: tokenAccountsResult.refetchSellTokenAccount,
    isLoadingBuy: tokenAccountsResult.isLoadingBuy,
    isLoadingSell: tokenAccountsResult.isLoadingSell,
    isRefreshingBuy,
    isRefreshingSell,
    errorBuy: tokenAccountsResult.errorBuy,
    errorSell: tokenAccountsResult.errorSell,
    isRealtimeBuy: !!publicKey && !!tokenAAddress,
    isRealtimeSell: !!publicKey && !!tokenBAddress,
    isRealtime: !!publicKey && !!tokenAAddress && !!tokenBAddress,
  };
}