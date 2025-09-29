import { createMachine, assign } from "xstate";
import type { LiquidityFormValues, PoolDetails, TokenAccountsData } from "../_types/liquidity.types";

export interface LiquidityMachineContext {
  formValues: LiquidityFormValues;
  poolDetails: PoolDetails | null;
  buyTokenAccount: TokenAccountsData | null;
  sellTokenAccount: TokenAccountsData | null;
  error: string | null;
  transactionSignature: string | null;
  liquidityStep: number;
  isCalculating: boolean;
}

export type LiquidityMachineEvent =
  | { type: "UPDATE_FORM"; data: Partial<LiquidityFormValues> }
  | { type: "UPDATE_POOL_DETAILS"; data: PoolDetails | null }
  | { type: "UPDATE_TOKEN_ACCOUNTS"; buyAccount: TokenAccountsData | null; sellAccount: TokenAccountsData | null }
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "SUBMIT" }
  | { type: "SIGN_TRANSACTION"; signature: string }
  | { type: "SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "RESET" };

export const enhancedLiquidityMachine = createMachine({
  id: "enhancedLiquidity",
  initial: "idle",
  context: {
    formValues: {
      tokenAAmount: "0",
      tokenBAmount: "0",
      initialPrice: "1",
    },
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
        UPDATE_FORM: {
          actions: assign({
            formValues: ({ context, event }) => ({
              ...context.formValues,
              ...event.data,
            }),
          }),
        },
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
        UPDATE_FORM: {
          actions: assign({
            formValues: ({ context, event }) => ({
              ...context.formValues,
              ...event.data,
            }),
          }),
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
            formValues: {
              tokenAAmount: "0",
              tokenBAmount: "0",
              initialPrice: "1",
            },
            error: null,
            transactionSignature: null,
            liquidityStep: 0,
          }),
        },
        UPDATE_FORM: {
          target: "idle",
          actions: assign({
            formValues: ({ context, event }) => ({
              ...context.formValues,
              ...event.data,
            }),
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
            formValues: {
              tokenAAmount: "0",
              tokenBAmount: "0",
              initialPrice: "1",
            },
            error: null,
            transactionSignature: null,
            liquidityStep: 0,
          }),
        },
        UPDATE_FORM: {
          target: "idle",
          actions: assign({
            formValues: ({ context, event }) => ({
              ...context.formValues,
              ...event.data,
            }),
            error: null,
          }),
        },
      },
    },
  },
});