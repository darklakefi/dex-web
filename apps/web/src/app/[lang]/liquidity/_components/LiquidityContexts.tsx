"use client";

import type { PublicKey } from "@solana/web3.js";
import type { FormApi } from "@tanstack/react-form";
import { createContext, useContext, useMemo } from "react";
import type { ActorRefFrom } from "xstate";
import type {
  LiquidityMachineEvent,
  liquidityMachine,
} from "../_machines/liquidityMachine";
import type {
  CalculationParams,
  LiquidityFormValues,
  LiquidityTrackingData,
  PoolDetails,
  UseRealtimeTokenAccountsReturn,
  WalletAdapter,
} from "../_types/liquidity.types";

export interface LiquidityFormStateContextValue {
  readonly form: FormApi<
    LiquidityFormValues,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >;
  readonly state: ActorRefFrom<typeof liquidityMachine>;
  readonly send: (event: LiquidityMachineEvent) => void;
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
  readonly isCalculating: boolean;
  readonly hasError: boolean;
}

const LiquidityFormStateContext =
  createContext<LiquidityFormStateContextValue | null>(null);

export function useLiquidityFormState() {
  const context = useContext(LiquidityFormStateContext);
  if (!context) {
    throw new Error(
      "useLiquidityFormState must be used within LiquidityFormStateProvider",
    );
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
  return (
    <LiquidityFormStateContext.Provider value={value}>
      {children}
    </LiquidityFormStateContext.Provider>
  );
}

export interface LiquidityDataContextValue {
  readonly poolDetails: PoolDetails | null;
  readonly tokenAccountsData: UseRealtimeTokenAccountsReturn;
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
}

const LiquidityDataContext = createContext<LiquidityDataContextValue | null>(
  null,
);

export function useLiquidityData() {
  const context = useContext(LiquidityDataContext);
  if (!context) {
    throw new Error(
      "useLiquidityData must be used within LiquidityDataProvider",
    );
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
  return (
    <LiquidityDataContext.Provider value={value}>
      {children}
    </LiquidityDataContext.Provider>
  );
}

export interface LiquidityActionsContextValue {
  readonly resetFormToDefaults: () => void;
  readonly handleAmountChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => void;
  readonly clearPendingCalculations: () => void;
  readonly calculateTokenAmounts: (params: CalculationParams) => Promise<void>;
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

const LiquidityActionsContext =
  createContext<LiquidityActionsContextValue | null>(null);

export function useLiquidityActions() {
  const context = useContext(LiquidityActionsContext);
  if (!context) {
    throw new Error(
      "useLiquidityActions must be used within LiquidityActionsProvider",
    );
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
  const memoizedValue = useMemo(
    () => value,
    [
      value.resetFormToDefaults,
      value.handleAmountChange,
      value.clearPendingCalculations,
      value.calculateTokenAmounts,
      value.trackLiquidityAction,
      value.trackError,
      value.handleError,
      value,
    ],
  );

  return (
    <LiquidityActionsContext.Provider value={memoizedValue}>
      {children}
    </LiquidityActionsContext.Provider>
  );
}

export interface LiquidityWalletContextValue {
  readonly publicKey: PublicKey | null;
  readonly walletAdapter: WalletAdapter | null;
}

const LiquidityWalletContext =
  createContext<LiquidityWalletContextValue | null>(null);

export function useLiquidityWallet() {
  const context = useContext(LiquidityWalletContext);
  if (!context) {
    throw new Error(
      "useLiquidityWallet must be used within LiquidityWalletProvider",
    );
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
  const memoizedValue = useMemo(
    () => value,
    [value.publicKey, value.walletAdapter, value],
  );

  return (
    <LiquidityWalletContext.Provider value={memoizedValue}>
      {children}
    </LiquidityWalletContext.Provider>
  );
}

export interface LiquiditySettingsContextValue {
  readonly slippage: string;
  readonly setSlippage: (slippage: string) => void;
}

const LiquiditySettingsContext =
  createContext<LiquiditySettingsContextValue | null>(null);

export function useLiquiditySettings() {
  const context = useContext(LiquiditySettingsContext);
  if (!context) {
    throw new Error(
      "useLiquiditySettings must be used within LiquiditySettingsProvider",
    );
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
  const memoizedValue = useMemo(
    () => value,
    [value.slippage, value.setSlippage, value],
  );

  return (
    <LiquiditySettingsContext.Provider value={memoizedValue}>
      {children}
    </LiquiditySettingsContext.Provider>
  );
}

export function useLiquidityForm() {
  return {
    ...useLiquidityFormState(),
    ...useLiquidityData(),
    ...useLiquidityActions(),
    ...useLiquidityWallet(),
    ...useLiquiditySettings(),
  };
}

export function useLiquidityFormSpecific() {
  return {
    actions: useLiquidityActions(),
    data: useLiquidityData(),
    formState: useLiquidityFormState(),
    settings: useLiquiditySettings(),
    wallet: useLiquidityWallet(),
  };
}
