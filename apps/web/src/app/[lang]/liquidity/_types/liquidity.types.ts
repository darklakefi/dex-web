import { z } from "zod";
import type { PublicKey } from "@solana/web3.js";
import type { FormApi } from "@tanstack/react-form";

export const numericStringSchema = z.string().refine(
  (val) => !Number.isNaN(Number(val)) && val !== "" && Number(val) >= 0,
  "Must be a valid number"
);

export const positiveNumericStringSchema = numericStringSchema.refine(
  (val) => Number(val) > 0,
  "Must be positive"
);

export const liquidityFormSchema = z.object({
  tokenAAmount: numericStringSchema,
  tokenBAmount: numericStringSchema,
  initialPrice: positiveNumericStringSchema,
});

export type LiquidityFormSchema = z.infer<typeof liquidityFormSchema>;

export interface TokenAccount {
  readonly address?: string;
  readonly mint: string;
  readonly amount: number;
  readonly decimals: number;
  readonly symbol: string;
}

export interface TokenAccountsData {
  readonly tokenAccounts: ReadonlyArray<TokenAccount>;
}

export interface PoolDetails {
  readonly poolAddress?: string;
  readonly tokenXMint: string;
  readonly tokenYMint: string;
  readonly tokenXReserve?: number;
  readonly tokenYReserve?: number;
  readonly totalSupply?: number;
  readonly fee?: number;
  readonly price?: string;
}

export interface LiquidityFormValues {
  readonly tokenAAmount: string;
  readonly tokenBAmount: string;
  readonly initialPrice: string;
}

export interface WalletAdapter {
  readonly wallet: {
    readonly adapter: {
      readonly name: string;
    };
  } | null;
}

export interface TransactionContext {
  readonly tokenA: string;
  readonly tokenB: string;
  readonly amountA: string;
  readonly amountB: string;
  readonly signature?: string;
  readonly timestamp: number;
}

export interface ValidationError {
  readonly field: keyof LiquidityFormValues | "general";
  readonly message: string;
  readonly code: string;
}

export interface TransactionError {
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface LiquidityTrackingData {
  readonly action: "add" | "remove";
  readonly tokenA: string;
  readonly tokenB: string;
  readonly amountA: number;
  readonly amountB: number;
  readonly transactionHash?: string;
}

export interface ErrorTrackingData {
  readonly context: string;
  readonly error: string;
  readonly details?: Record<string, unknown>;
}

export interface UseRealtimePoolDataReturn {
  readonly poolDetails: PoolDetails | null;
  readonly isRealtime: boolean;
  readonly isLoading: boolean;
}

export interface UseRealtimeTokenAccountsReturn {
  readonly buyTokenAccount: TokenAccountsData | undefined;
  readonly sellTokenAccount: TokenAccountsData | undefined;
  readonly refetchBuyTokenAccount: () => void;
  readonly refetchSellTokenAccount: () => void;
  readonly isLoadingBuy: boolean;
  readonly isLoadingSell: boolean;
  readonly isRefreshingBuy: boolean;
  readonly isRefreshingSell: boolean;
  readonly isRealtime: boolean;
}

export interface LiquidityComponentProps {
  readonly publicKey: PublicKey | null;
  readonly walletAdapter: WalletAdapter | null;
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
  readonly poolDetails: PoolDetails | null;
  readonly buyTokenAccount: TokenAccountsData | undefined;
  readonly sellTokenAccount: TokenAccountsData | undefined;
}

export interface LiquidityFormProviderProps {
  readonly children: React.ReactNode;
  readonly tokenAAddress?: string | null;
  readonly tokenBAddress?: string | null;
}

export interface AmountChangeEvent {
  readonly target: { readonly value: string };
  readonly isTrusted?: boolean;
}

export interface CalculationParams {
  readonly inputAmount: string;
  readonly inputType: "tokenX" | "tokenY";
}

export type LiquidityState = "idle" | "calculating" | "submitting" | "signing" | "success" | "error";

export interface LiquidityFormContextValue {
  readonly form: FormApi<LiquidityFormValues, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>;

  readonly state: unknown; 
  readonly send: (event: unknown) => void;

  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly isCalculating: boolean;
  readonly hasError: boolean;

  readonly publicKey: PublicKey | null;
  readonly walletAdapter: WalletAdapter | null;

  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
  readonly poolDetails: PoolDetails | null;
  readonly tokenAccountsData: UseRealtimeTokenAccountsReturn;

  readonly slippage: string;
  readonly setSlippage: (slippage: string) => void;

  readonly resetFormToDefaults: () => void;
  readonly handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>, type: "buy" | "sell") => void;
  readonly clearPendingCalculations: () => void;
  readonly calculateTokenAmounts: (params: { inputAmount: string; inputType: "tokenX" | "tokenY" }) => Promise<void>;

  readonly trackLiquidityAction: (data: LiquidityTrackingData) => void;
  readonly trackError: (error: unknown, context?: Record<string, unknown>) => void;

  readonly handleError: (error: unknown, context?: Record<string, unknown>) => void;
}