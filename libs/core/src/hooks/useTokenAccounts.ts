"use client";

import type { PublicKey } from "@solana/web3.js";
import { type QueryFunctionContext, useQuery } from "@tanstack/react-query";

/**
 * Token type enum for SOL variants
 */
export enum SolTokenType {
  NATIVE_SOL = "NATIVE_SOL",
  WRAPPED_SOL = "WRAPPED_SOL",
  OTHER = "OTHER",
}

const SOL_TOKEN_ADDRESS = "So11111111111111111111111111111111111111111";

/**
 * Determine if native SOL balance should be used for this token
 * Returns true only for native SOL, false for WSOL and other tokens
 */
function shouldUseNativeSolBalance(
  address: string | null | undefined,
): boolean {
  return address === SOL_TOKEN_ADDRESS;
}

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
  /** Whether this represents native SOL balance */
  isNativeSol?: boolean;
  /** The SOL token type */
  solTokenType?: SolTokenType;
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
  /** Whether buy token uses native SOL balance */
  buyTokenUsesNativeSol: boolean;
  /** Whether sell token uses native SOL balance */
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

  // Determine if tokens use native SOL balance
  const buyTokenUsesNativeSol = shouldUseNativeSolBalance(tokenAAddress);
  const sellTokenUsesNativeSol = shouldUseNativeSolBalance(tokenBAddress);

  const buyQueryOptions = tanstackClient.helius.getTokenAccounts.queryOptions({
    input: {
      mint: tokenAAddress || "",
      ownerAddress: publicKey?.toBase58() || "",
    },
  });

  const sellQueryOptions = tanstackClient.helius.getTokenAccounts.queryOptions({
    input: {
      mint: tokenBAddress || "",
      ownerAddress: publicKey?.toBase58() || "",
    },
  });

  const {
    data: buyTokenAccount,
    refetch: refetchBuyTokenAccount,
    isLoading: isLoadingBuy,
    error: errorBuy,
  } = useQuery({
    ...buyQueryOptions,
    enabled: !!publicKey && !!tokenAAddress,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryKey: [...buyQueryOptions.queryKey, networkKey] as const,
    staleTime: 30 * 1000,
  });

  const {
    data: sellTokenAccount,
    refetch: refetchSellTokenAccount,
    isLoading: isLoadingSell,
    error: errorSell,
  } = useQuery({
    ...sellQueryOptions,
    enabled: !!publicKey && !!tokenBAddress,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    queryKey: [...sellQueryOptions.queryKey, networkKey] as const,
    staleTime: 30 * 1000,
  });

  return {
    buyTokenAccount: buyTokenAccount as TokenAccountsData | undefined,
    buyTokenUsesNativeSol,
    errorBuy,
    errorSell,
    isLoadingBuy,
    isLoadingSell,
    refetchBuyTokenAccount,
    refetchSellTokenAccount,
    sellTokenAccount: sellTokenAccount as TokenAccountsData | undefined,
    sellTokenUsesNativeSol,
  };
};
