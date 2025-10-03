import { assign, fromPromise, setup } from "xstate";
import type {
  LiquidityFormValues,
  PoolDetails,
  TokenAccountsData,
} from "../_types/liquidity.types";

export interface LiquidityMachineContext {
  poolDetails: PoolDetails | null;
  buyTokenAccount: TokenAccountsData | null;
  sellTokenAccount: TokenAccountsData | null;
  error: string | null;
  transactionSignature: string | null;
  liquidityStep: number;
  formData: LiquidityFormValues | null;
  isCalculating: boolean;
}

export type LiquidityMachineEvent =
  | { type: "UPDATE_POOL_DETAILS"; data: PoolDetails | null }
  | {
      type: "UPDATE_TOKEN_ACCOUNTS";
      buyAccount: TokenAccountsData | null;
      sellAccount: TokenAccountsData | null;
    }
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "CALCULATE"; data: LiquidityFormValues }
  | { type: "SUBMIT"; data: LiquidityFormValues }
  | { type: "SIGN_TRANSACTION"; signature: string }
  | { type: "SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "RESET" };

export const liquidityMachine = setup({
  actors: {
    calculateLiquidity: fromPromise(
      async ({ input: _input }: { input: LiquidityFormValues }) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { result: "calculated" };
      },
    ),
    submitTransaction: fromPromise(
      async ({ input: _input }: { input: LiquidityFormValues }) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { signature: "mock-signature" };
      },
    ),
  },
  types: {} as {
    context: LiquidityMachineContext;
    events: LiquidityMachineEvent;
  },
}).createMachine({
  context: {
    buyTokenAccount: null,
    error: null,
    formData: null,
    isCalculating: false,
    liquidityStep: 0,
    poolDetails: null,
    sellTokenAccount: null,
    transactionSignature: null,
  } as LiquidityMachineContext,
  id: "liquidity",
  initial: "idle",
  states: {
    calculating: {
      invoke: {
        input: ({ context }) =>
          context.formData || {
            initialPrice: "0",
            tokenAAmount: "0",
            tokenBAmount: "0",
          },
        onDone: {
          actions: assign({
            error: null,
            isCalculating: false,
          }),
          target: "idle",
        },
        onError: {
          actions: assign({
            error: ({ event }) => String(event.error),
            isCalculating: false,
          }),
          target: "error",
        },
        src: "calculateLiquidity",
      },
      on: {
        FINISH_CALCULATION: {
          actions: assign({
            isCalculating: false,
          }),
          target: "idle",
        },
        SUBMIT: {
          target: "submitting",
        },
      },
    },
    error: {
      on: {
        RESET: {
          actions: assign({
            error: null,
            isCalculating: false,
            liquidityStep: 0,
            transactionSignature: null,
          }),
          target: "idle",
        },
        RETRY: {
          target: "submitting",
        },
      },
    },
    idle: {
      on: {
        CALCULATE: {
          actions: assign({
            formData: ({ event }) => event.data,
            isCalculating: true,
          }),
          target: "calculating",
        },
        START_CALCULATION: {
          actions: assign({
            isCalculating: true,
          }),
          target: "calculating",
        },
        SUBMIT: {
          target: "submitting",
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
      },
    },
    signing: {
      entry: assign({
        liquidityStep: 3,
      }),
      on: {
        ERROR: {
          actions: assign({
            error: ({ event }) => event.error,
            liquidityStep: 0,
          }),
          target: "error",
        },
        SUCCESS: {
          actions: assign({
            error: null,
            liquidityStep: 0,
          }),
          target: "success",
        },
      },
    },
    submitting: {
      entry: assign({
        error: null,
        liquidityStep: 1,
      }),
      on: {
        ERROR: {
          actions: assign({
            error: ({ event }) => event.error,
            liquidityStep: 0,
          }),
          target: "error",
        },
        SIGN_TRANSACTION: {
          actions: assign({
            liquidityStep: 2,
            transactionSignature: ({ event }) => event.signature,
          }),
          target: "signing",
        },
      },
    },
    success: {
      on: {
        RESET: {
          actions: assign({
            error: null,
            isCalculating: false,
            liquidityStep: 0,
            transactionSignature: null,
          }),
          target: "idle",
        },
      },
    },
  },
});

export type LiquidityMachine = typeof liquidityMachine;

export type LiquidityState =
  | "idle"
  | "calculating"
  | "submitting"
  | "signing"
  | "success"
  | "error";

export const isLiquidityState = (state: string): state is LiquidityState => {
  return [
    "idle",
    "calculating",
    "submitting",
    "signing",
    "success",
    "error",
  ].includes(state);
};
