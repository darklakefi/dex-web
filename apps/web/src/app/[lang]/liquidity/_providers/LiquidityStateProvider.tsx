"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useMachine } from "@xstate/react";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type { LiquidityMachineEvent } from "../_machines/liquidityMachine";
import { usePoolData } from "./LiquidityDataProvider";

interface LiquidityStateContextValue {
  state: any;
  send: (event: LiquidityMachineEvent) => void;
  isCalculating: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
}

const LiquidityStateContext = createContext<LiquidityStateContextValue | null>(null);

interface LiquidityStateProviderProps {
  children: ReactNode;
}

export function LiquidityStateProvider({ children }: LiquidityStateProviderProps) {
  const { poolDetails, tokenAccountsData } = usePoolData();
  
  const [state, send] = useMachine(liquidityMachine, {
    input: {
      buyTokenAccount: null,
      poolDetails: poolDetails,
      sellTokenAccount: null,
    },
  });

  useEffect(() => {
    send({
      type: "UPDATE_POOL_DETAILS",
      data: poolDetails,
    });
  }, [send, poolDetails]);

  useEffect(() => {
    send({
      type: "UPDATE_TOKEN_ACCOUNTS",
      buyAccount: tokenAccountsData.buyTokenAccount ?? null,
      sellAccount: tokenAccountsData.sellTokenAccount ?? null,
    });
  }, [send, tokenAccountsData.buyTokenAccount, tokenAccountsData.sellTokenAccount]);

  const value: LiquidityStateContextValue = {
    state,
    send,
    isCalculating: state.matches("calculating"),
    isSubmitting: state.matches("submitting"),
    isSuccess: state.matches("success"),
    isError: state.matches("error"),
    error: state.context.error,
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
    throw new Error("useLiquidityState must be used within a LiquidityStateProvider");
  }
  return context;
}