import type { TokenAccountsData } from "@dex-web/core";
import type {
  FormApi,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import type { ReactNode } from "react";
import type {
  LiquidityFormValues,
  liquidityFormSchema,
  PoolDetails,
} from "./liquidity.types";

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
  form: FormApi<
    LiquidityFormValues,
    FormValidateOrFn<LiquidityFormValues> | undefined,
    typeof liquidityFormSchema,
    undefined,
    undefined,
    undefined,
    undefined,
    FormAsyncValidateOrFn<LiquidityFormValues> | undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >;
  isSubmitting: boolean;
  isValid: boolean;
  submitForm: () => Promise<void>;
}

export interface LiquidityStateContextValue {
  state: unknown;
  send: (event: unknown) => void;
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
