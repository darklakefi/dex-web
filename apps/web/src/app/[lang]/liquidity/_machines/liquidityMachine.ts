import { assign, setup } from 'xstate';
import type { LiquidityFormValues, PoolDetails, TokenAccountsData } from "../_types/liquidity.types";

export interface LiquidityMachineContext {
  poolDetails: PoolDetails | null;
  buyTokenAccount: TokenAccountsData | null;
  sellTokenAccount: TokenAccountsData | null;
  error: string | null;
  transactionSignature: string | null;
  liquidityStep: number;
  isCalculating: boolean;
}

export type LiquidityMachineEvent =
  | { type: "UPDATE_POOL_DETAILS"; data: PoolDetails | null }
  | { type: "UPDATE_TOKEN_ACCOUNTS"; buyAccount: TokenAccountsData | null; sellAccount: TokenAccountsData | null }
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "SUBMIT"; data: LiquidityFormValues }
  | { type: "SIGN_TRANSACTION"; signature: string }
  | { type: "SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "RESET" };

export const liquidityMachine = setup({
  types: {} as {
    context: LiquidityMachineContext;
    events: LiquidityMachineEvent;
  },
}).createMachine({
  id: "liquidity",
  initial: "idle",
  context: {
    poolDetails: null,
    buyTokenAccount: null,
    sellTokenAccount: null,
    error: null,
    transactionSignature: null,
    liquidityStep: 0,
    isCalculating: false,
  } as LiquidityMachineContext,
  states: {
    idle: {
      on: {
        UPDATE_POOL_DETAILS: {
          actions: assign({
            poolDetails: ({ event }) => event.data,
          }),
        },
        UPDATE_TOKEN_ACCOUNTS: {
          actions: assign({
            buyTokenAccount: ({ event }) => event.buyAccount,
            sellTokenAccount: ({ event }) => event.sellAccount,
          }),
        },
        START_CALCULATION: {
          target: "calculating",
        },
        SUBMIT: {
          target: "submitting",
        },
      },
    },
    calculating: {
      entry: assign({
        isCalculating: true,
      }),
      exit: assign({
        isCalculating: false,
      }),
      on: {
        FINISH_CALCULATION: {
          target: "idle",
        },
        SUBMIT: {
          target: "submitting",
        },
      },
    },
    submitting: {
      entry: assign({
        liquidityStep: 1,
        error: null,
      }),
      on: {
        SIGN_TRANSACTION: {
          target: "signing",
          actions: assign({
            transactionSignature: ({ event }) => event.signature,
            liquidityStep: 2,
          }),
        },
        ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
            liquidityStep: 0,
          }),
        },
      },
    },
    signing: {
      entry: assign({
        liquidityStep: 3,
      }),
      on: {
        SUCCESS: {
          target: "success",
          actions: assign({
            liquidityStep: 0,
            error: null,
          }),
        },
        ERROR: {
          target: "error",
          actions: assign({
            error: ({ event }) => event.error,
            liquidityStep: 0,
          }),
        },
      },
    },
    success: {
      on: {
        RESET: {
          target: "idle",
          actions: assign({
            error: null,
            transactionSignature: null,
            liquidityStep: 0,
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: "submitting",
        },
        RESET: {
          target: "idle",
          actions: assign({
            error: null,
            transactionSignature: null,
            liquidityStep: 0,
          }),
        },
      },
    },
  },
});

export type LiquidityMachine = typeof liquidityMachine;

export type LiquidityState = 'idle' | 'calculating' | 'submitting' | 'signing' | 'success' | 'error';

export const isLiquidityState = (state: string): state is LiquidityState => {
  return ['idle', 'calculating', 'submitting', 'signing', 'success', 'error'].includes(state);
};