"use client";

import { createContext, useContext, useMemo } from "react";
import type { PublicKey } from "@solana/web3.js";
import type { FormApi } from "@tanstack/react-form";
import type {
  LiquidityFormValues,
  WalletAdapter,
  PoolDetails,
  UseRealtimeTokenAccountsReturn,
  LiquidityTrackingData,
  CalculationParams,
} from "../_types/liquidity.types";

// Form State Context - Updates frequently with form interactions
export interface LiquidityFormStateContextValue {
  readonly form: FormApi<LiquidityFormValues, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>;
  readonly state: any; // XState machine context
  readonly send: (event: any) => void;
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly isCalculating: boolean;
  readonly hasError: boolean;
}

const LiquidityFormStateContext = createContext<LiquidityFormStateContextValue | null>(null);

export function useLiquidityFormState() {
  const context = useContext(LiquidityFormStateContext);
  if (!context) {
    throw new Error("useLiquidityFormState must be used within LiquidityFormStateProvider");
  }
  return context;
}

export function LiquidityFormStateProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LiquidityFormStateContextValue;
}) {
  const memoizedValue = useMemo(() => value, [
    value.form,
    value.state,
    value.send,
    value.isSubmitting,
    value.isSuccess,
    value.isError,
    value.isCalculating,
    value.hasError,
  ]);

  return (
    <LiquidityFormStateContext.Provider value={memoizedValue}>
      {children}
    </LiquidityFormStateContext.Provider>
  );
}

// Data Context - Updates occasionally when pool or token data changes
export interface LiquidityDataContextValue {
  readonly poolDetails: PoolDetails | null;
  readonly tokenAccountsData: UseRealtimeTokenAccountsReturn;
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
}

const LiquidityDataContext = createContext<LiquidityDataContextValue | null>(null);

export function useLiquidityData() {
  const context = useContext(LiquidityDataContext);
  if (!context) {
    throw new Error("useLiquidityData must be used within LiquidityDataProvider");
  }
  return context;
}

export function LiquidityDataProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LiquidityDataContextValue;
}) {
  const memoizedValue = useMemo(() => value, [
    value.poolDetails,
    value.tokenAccountsData,
    value.tokenAAddress,
    value.tokenBAddress,
  ]);

  return (
    <LiquidityDataContext.Provider value={memoizedValue}>
      {children}
    </LiquidityDataContext.Provider>
  );
}

// Actions Context - Stable function references that rarely change
export interface LiquidityActionsContextValue {
  readonly resetFormToDefaults: () => void;
  readonly handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>, type: "buy" | "sell") => void;
  readonly clearPendingCalculations: () => void;
  readonly calculateTokenAmounts: (params: CalculationParams) => Promise<void>;
  readonly trackLiquidityAction: (data: LiquidityTrackingData) => void;
  readonly trackError: (error: unknown, context?: Record<string, any>) => void;
  readonly handleError: (error: unknown, context?: Record<string, any>) => void;
}

const LiquidityActionsContext = createContext<LiquidityActionsContextValue | null>(null);

export function useLiquidityActions() {
  const context = useContext(LiquidityActionsContext);
  if (!context) {
    throw new Error("useLiquidityActions must be used within LiquidityActionsProvider");
  }
  return context;
}

export function LiquidityActionsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LiquidityActionsContextValue;
}) {
  const memoizedValue = useMemo(() => value, [
    value.resetFormToDefaults,
    value.handleAmountChange,
    value.clearPendingCalculations,
    value.calculateTokenAmounts,
    value.trackLiquidityAction,
    value.trackError,
    value.handleError,
  ]);

  return (
    <LiquidityActionsContext.Provider value={memoizedValue}>
      {children}
    </LiquidityActionsContext.Provider>
  );
}

// Wallet Context - Stable once wallet is connected
export interface LiquidityWalletContextValue {
  readonly publicKey: PublicKey | null;
  readonly walletAdapter: WalletAdapter | null;
}

const LiquidityWalletContext = createContext<LiquidityWalletContextValue | null>(null);

export function useLiquidityWallet() {
  const context = useContext(LiquidityWalletContext);
  if (!context) {
    throw new Error("useLiquidityWallet must be used within LiquidityWalletProvider");
  }
  return context;
}

export function LiquidityWalletProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LiquidityWalletContextValue;
}) {
  const memoizedValue = useMemo(() => value, [
    value.publicKey,
    value.walletAdapter,
  ]);

  return (
    <LiquidityWalletContext.Provider value={memoizedValue}>
      {children}
    </LiquidityWalletContext.Provider>
  );
}

// Settings Context - Rarely changes (slippage, preferences)
export interface LiquiditySettingsContextValue {
  readonly slippage: string;
  readonly setSlippage: (slippage: string) => void;
}

const LiquiditySettingsContext = createContext<LiquiditySettingsContextValue | null>(null);

export function useLiquiditySettings() {
  const context = useContext(LiquiditySettingsContext);
  if (!context) {
    throw new Error("useLiquiditySettings must be used within LiquiditySettingsProvider");
  }
  return context;
}

export function LiquiditySettingsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: LiquiditySettingsContextValue;
}) {
  const memoizedValue = useMemo(() => value, [
    value.slippage,
    value.setSlippage,
  ]);

  return (
    <LiquiditySettingsContext.Provider value={memoizedValue}>
      {children}
    </LiquiditySettingsContext.Provider>
  );
}

// Composite hook for components that need multiple contexts
export function useLiquidityForm() {
  return {
    ...useLiquidityFormState(),
    ...useLiquidityData(),
    ...useLiquidityActions(),
    ...useLiquidityWallet(),
    ...useLiquiditySettings(),
  };
}

// Selective hooks for components that only need specific contexts
export function useLiquidityFormSpecific() {
  return {
    formState: useLiquidityFormState(),
    data: useLiquidityData(),
    actions: useLiquidityActions(),
    wallet: useLiquidityWallet(),
    settings: useLiquiditySettings(),
  };
}