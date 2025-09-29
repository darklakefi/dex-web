import type { TokenAccountsData } from "@dex-web/core";
import type { ReactNode } from "react";
import type { PoolDetails } from "./liquidity.types";

export interface LiquidityProviderProps {
  children: ReactNode;
  tokenAAddress: string;
  tokenBAddress: string;
}

export interface LiquidityDataContextValue {
  poolDetails: PoolDetails | null;
  tokenAccountsData: {
    buyTokenAccount: TokenAccountsData | null;
    sellTokenAccount: TokenAccountsData | null;
    isLoading: boolean;
    error: Error | null;
  };
  tokenXMint: string;
  tokenYMint: string;
  isLoading: boolean;
  error: Error | null;
}

export interface LiquidityFormContextValue {
  form: any;
  isSubmitting: boolean;
  isValid: boolean;
  submitForm: () => Promise<void>;
}

export interface LiquidityStateContextValue {
  state: any;
  send: (event: any) => void;
  isCalculating: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

export interface UseRealtimeTokenAccountsReturn {
  buyTokenAccount: TokenAccountsData | null;
  sellTokenAccount: TokenAccountsData | null;
  isLoading: boolean;
  error: Error | null;
}
