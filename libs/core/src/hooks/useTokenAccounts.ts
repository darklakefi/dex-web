"use client";

import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";

import type { PublicKey } from "@solana/web3.js";

export interface TokenAccountsQueryClient {
  helius: {
    getTokenAccounts: {
      queryOptions: (input: {
        input: {
          mint: string;
          ownerAddress: string;
        };
      }) => {
        queryKey: readonly unknown[];
        queryFn: (
          context: QueryFunctionContext,
        ) => Promise<TokenAccountsData> | TokenAccountsData;
      };
    };
  };
}

export interface UseTokenAccountsParams {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  publicKey: PublicKey | null;
  tanstackClient: TokenAccountsQueryClient;
}

export interface TokenAccount {
  address: string;
  amount: number;
  decimals: number;
  mint: string;
  symbol: string;
}

export interface TokenAccountsData {
  tokenAccounts: TokenAccount[];
}

export interface UseTokenAccountsReturn {
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
  refetchBuyTokenAccount: () => Promise<unknown>;
  refetchSellTokenAccount: () => Promise<unknown>;
  isLoadingBuy: boolean;
  isLoadingSell: boolean;
  errorBuy: Error | null;
  errorSell: Error | null;
}

export const useTokenAccounts = ({
  tokenAAddress,
  tokenBAddress,
  publicKey,
  tanstackClient,
}: UseTokenAccountsParams): UseTokenAccountsReturn => {
  const {
    data: buyTokenAccount,
    refetch: refetchBuyTokenAccount,
    isLoading: isLoadingBuy,
    error: errorBuy,
  } = useQuery({
    ...tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenAAddress || "",
        ownerAddress: publicKey?.toBase58() || "",
      },
    }),
    enabled: !!publicKey && !!tokenAAddress,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const {
    data: sellTokenAccount,
    refetch: refetchSellTokenAccount,
    isLoading: isLoadingSell,
    error: errorSell,
  } = useQuery({
    ...tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenBAddress || "",
        ownerAddress: publicKey?.toBase58() || "",
      },
    }),
    enabled: !!publicKey && !!tokenBAddress,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  return {
    buyTokenAccount: buyTokenAccount as TokenAccountsData | undefined,
    sellTokenAccount: sellTokenAccount as TokenAccountsData | undefined,
    refetchBuyTokenAccount,
    refetchSellTokenAccount,
    isLoadingBuy,
    isLoadingSell,
    errorBuy,
    errorSell,
  };
};
