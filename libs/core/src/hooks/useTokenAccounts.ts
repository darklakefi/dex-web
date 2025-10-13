"use client";

import { shouldUseNativeSolBalance } from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import { type QueryFunctionContext, useQuery } from "@tanstack/react-query";

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
  network?: string | null;
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
  tokenAAccount: TokenAccountsData | undefined;
  tokenBAccount: TokenAccountsData | undefined;
  refetchTokenAAccount: () => Promise<unknown>;
  refetchTokenBAccount: () => Promise<unknown>;
  isLoadingTokenA: boolean;
  isLoadingTokenB: boolean;
  errorTokenA: Error | null;
  errorTokenB: Error | null;
  tokenAUsesNativeSol: boolean;
  tokenBUsesNativeSol: boolean;
  buyTokenAccount: TokenAccountsData | undefined;
  sellTokenAccount: TokenAccountsData | undefined;
  refetchBuyTokenAccount: () => Promise<unknown>;
  refetchSellTokenAccount: () => Promise<unknown>;
  isLoadingBuy: boolean;
  isLoadingSell: boolean;
  errorBuy: Error | null;
  errorSell: Error | null;
  buyTokenUsesNativeSol: boolean;
  sellTokenUsesNativeSol: boolean;
}

const DEFAULT_NETWORK = "mainnet";

const resolveNetwork = (network?: string | null): string => {
  if (network) {
    return network;
  }

  if (process.env.NEXT_PUBLIC_NETWORK === "2") {
    return "devnet";
  }

  return DEFAULT_NETWORK;
};

export const useTokenAccounts = ({
  tokenAAddress,
  tokenBAddress,
  publicKey,
  tanstackClient,
  network,
}: UseTokenAccountsParams): UseTokenAccountsReturn => {
  const networkKey = resolveNetwork(network);

  const tokenAUsesNativeSol = shouldUseNativeSolBalance(tokenAAddress);
  const tokenBUsesNativeSol = shouldUseNativeSolBalance(tokenBAddress);

  const tokenAQueryOptions =
    tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenAAddress || "",
        ownerAddress: publicKey?.toBase58?.() || "",
      },
    });

  const tokenBQueryOptions =
    tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenBAddress || "",
        ownerAddress: publicKey?.toBase58?.() || "",
      },
    });

  const {
    data: tokenAAccount,
    refetch: refetchTokenAAccount,
    isLoading: isLoadingTokenA,
    error: errorTokenA,
  } = useQuery({
    ...tokenAQueryOptions,
    enabled: !!publicKey && !!tokenAAddress,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryKey: [...tokenAQueryOptions.queryKey, networkKey] as const,
    staleTime: 30 * 1000,
  });

  const {
    data: tokenBAccount,
    refetch: refetchTokenBAccount,
    isLoading: isLoadingTokenB,
    error: errorTokenB,
  } = useQuery({
    ...tokenBQueryOptions,
    enabled: !!publicKey && !!tokenBAddress,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryKey: [...tokenBQueryOptions.queryKey, networkKey] as const,
    staleTime: 30 * 1000,
  });

  return {
    buyTokenAccount: tokenAAccount as TokenAccountsData | undefined,
    buyTokenUsesNativeSol: tokenAUsesNativeSol,
    errorBuy: errorTokenA,
    errorSell: errorTokenB,
    errorTokenA,
    errorTokenB,
    isLoadingBuy: isLoadingTokenA,
    isLoadingSell: isLoadingTokenB,
    isLoadingTokenA,
    isLoadingTokenB,
    refetchBuyTokenAccount: refetchTokenAAccount,
    refetchSellTokenAccount: refetchTokenBAccount,
    refetchTokenAAccount,
    refetchTokenBAccount,
    sellTokenAccount: tokenBAccount as TokenAccountsData | undefined,
    sellTokenUsesNativeSol: tokenBUsesNativeSol,

    tokenAAccount: tokenAAccount as TokenAccountsData | undefined,
    tokenAUsesNativeSol,
    tokenBAccount: tokenBAccount as TokenAccountsData | undefined,
    tokenBUsesNativeSol,
  };
};
