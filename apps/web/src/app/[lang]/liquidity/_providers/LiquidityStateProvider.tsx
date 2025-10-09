"use client";

import { useMachine } from "@xstate/react";
import { createContext, type ReactNode, useContext } from "react";
import type { LiquidityMachineEvent } from "../_machines/liquidityMachine";
import { liquidityMachine } from "../_machines/liquidityMachine";
import { usePoolData } from "./LiquidityDataProvider";

interface LiquidityStateContextValue {
  state: ReturnType<typeof useMachine>[0];
  send: (event: LiquidityMachineEvent) => void;
  isCalculating: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

const LiquidityStateContext = createContext<LiquidityStateContextValue | null>(
  null,
);

interface LiquidityStateProviderProps {
  children: ReactNode;
}

export function LiquidityStateProvider({
  children,
}: LiquidityStateProviderProps) {
  const { poolDetails, tokenAccountsData } = usePoolData();

  const [state, send] = useMachine(liquidityMachine);

  const value: LiquidityStateContextValue = {
    error: state.context.error,
    isCalculating: state.matches({ ready: "calculating" }),
    isError: state.matches("error"),
    isSubmitting: state.matches("submitting"),
    isSuccess: state.matches("success"),
    send,
    state,
  };

  return (
    <LiquidityStateContext.Provider value={value}>
      {children}
    </LiquidityStateContext.Provider>
  );
}

export function useLiquidityState() {
  const context = useContext(LiquidityStateContext);
  if (!context) {
    throw new Error(
      "useLiquidityState must be used within a LiquidityStateProvider",
    );
  }
  return context;
}
