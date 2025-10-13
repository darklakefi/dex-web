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
  tokenAAccount: TokenAccountsData | undefined;
  tokenBAccount: TokenAccountsData | undefined;
  refetchTokenAAccount: () => Promise<unknown>;
  refetchTokenBAccount: () => Promise<unknown>;
  isLoadingTokenA: boolean;
  isLoadingTokenB: boolean;
  errorTokenA: Error | null;
  errorTokenB: Error | null;
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
  /** @deprecated Use tokenAUsesNativeSol instead */
  buyTokenUsesNativeSol: boolean;
  /** @deprecated Use tokenBUsesNativeSol instead */
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
