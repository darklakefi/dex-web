import { z } from "zod";
import type { PublicKey } from "@solana/web3.js";
import type { FormApi } from "@tanstack/react-form";

// Zod schemas for form validation
export const numericStringSchema = z.string().refine(
  (val) => !isNaN(Number(val)) && val !== "" && Number(val) >= 0,
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

// Core data interfaces
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

// Transaction and context interfaces
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
  readonly context?: Record<string, any>;
}

// Analytics tracking interfaces
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
  readonly details?: Record<string, any>;
}

// Hook return types
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

// Component props interfaces
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

// Event interfaces
export interface AmountChangeEvent {
  readonly target: { readonly value: string };
  readonly isTrusted?: boolean;
}

export interface CalculationParams {
  readonly inputAmount: string;
  readonly inputType: "tokenX" | "tokenY";
}

// State types
export type LiquidityState = "idle" | "calculating" | "submitting" | "signing" | "success" | "error";

// Form provider context interface
export interface LiquidityFormContextValue {
  // TanStack Form instance
  readonly form: FormApi<LiquidityFormValues, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>;

  // XState machine state and send function
  readonly state: any; // Will be typed properly with machine context
  readonly send: (event: any) => void;

  // State selectors for optimization
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly isCalculating: boolean;
  readonly hasError: boolean;

  // Wallet and user data
  readonly publicKey: PublicKey | null;
  readonly walletAdapter: WalletAdapter | null;

  // Token addresses and data
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
  readonly poolDetails: PoolDetails | null;
  readonly tokenAccountsData: UseRealtimeTokenAccountsReturn;

  // Transaction management
  readonly slippage: string;
  readonly setSlippage: (slippage: string) => void;

  // Form helpers
  readonly resetFormToDefaults: () => void;
  readonly handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>, type: "buy" | "sell") => void;
  readonly clearPendingCalculations: () => void;
  readonly calculateTokenAmounts: (params: { inputAmount: string; inputType: "tokenX" | "tokenY" }) => Promise<void>;

  // Analytics and tracking
  readonly trackLiquidityAction: (data: LiquidityTrackingData) => void;
  readonly trackError: (error: unknown, context?: Record<string, any>) => void;

  // Error handling
  readonly handleError: (error: unknown, context?: Record<string, any>) => void;
}