import type { PublicKey } from "@solana/web3.js";
import type {
  FormApi,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import * as z from "zod";

export const numericStringSchema = z
  .string()
  .refine(
    (val) => !Number.isNaN(Number(val)) && val !== "" && Number(val) >= 0,
    "Must be a valid number",
  );

export const positiveNumericStringSchema = numericStringSchema.refine(
  (val) => Number(val) > 0,
  "Must be positive",
);

export const liquidityFormSchema = z.object({
  initialPrice: positiveNumericStringSchema,
  slippage: numericStringSchema,
  tokenAAmount: numericStringSchema,
  tokenBAmount: numericStringSchema,
});

export type LiquidityFormValues = z.infer<typeof liquidityFormSchema>;

export type LiquidityFormSchema = LiquidityFormValues;

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

  readonly tokenXReserveRaw?: string;
  readonly tokenYReserve?: number;
  readonly tokenYReserveRaw?: string;
  readonly totalSupply?: number;
  readonly totalSupplyRaw?: string;
  readonly fee?: number;
  readonly price?: string;
  readonly totalReserveXRaw?: string;
  readonly totalReserveYRaw?: string;
  readonly protocolFeeX?: number;
  readonly protocolFeeY?: number;
  readonly userLockedX?: number;
  readonly userLockedY?: number;
  readonly lockedX?: number;
  readonly lockedY?: number;
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
  // NEW - Preferred naming
  readonly tokenAAccount: TokenAccountsData | undefined;
  readonly tokenBAccount: TokenAccountsData | undefined;
  readonly refetchTokenAAccount: () => void;
  readonly refetchTokenBAccount: () => void;
  readonly isLoadingTokenA: boolean;
  readonly isLoadingTokenB: boolean;
  readonly isRefreshingTokenA: boolean;
  readonly isRefreshingTokenB: boolean;
  readonly isRealtime: boolean;

  // DEPRECATED - Keep for backwards compatibility
  /** @deprecated Use tokenAAccount instead */
  readonly buyTokenAccount: TokenAccountsData | undefined;
  /** @deprecated Use tokenBAccount instead */
  readonly sellTokenAccount: TokenAccountsData | undefined;
  /** @deprecated Use refetchTokenAAccount instead */
  readonly refetchBuyTokenAccount: () => void;
  /** @deprecated Use refetchTokenBAccount instead */
  readonly refetchSellTokenAccount: () => void;
  /** @deprecated Use isLoadingTokenA instead */
  readonly isLoadingBuy: boolean;
  /** @deprecated Use isLoadingTokenB instead */
  readonly isLoadingSell: boolean;
  /** @deprecated Use isRefreshingTokenA instead */
  readonly isRefreshingBuy: boolean;
  /** @deprecated Use isRefreshingTokenB instead */
  readonly isRefreshingSell: boolean;
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

export type LiquidityState =
  | "idle"
  | "calculating"
  | "submitting"
  | "signing"
  | "success"
  | "error";

export interface LiquidityFormContextValue {
  readonly form: FormApi<
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
  readonly handleAmountChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => void;
  readonly clearPendingCalculations: () => void;
  readonly calculateTokenAmounts: (params: {
    inputAmount: string;
    inputType: "tokenX" | "tokenY";
  }) => Promise<void>;

  readonly trackLiquidityAction: (data: LiquidityTrackingData) => void;
  readonly trackError: (
    error: unknown,
    context?: Record<string, unknown>,
  ) => void;

  readonly handleError: (
    error: unknown,
    context?: Record<string, unknown>,
  ) => void;
}
