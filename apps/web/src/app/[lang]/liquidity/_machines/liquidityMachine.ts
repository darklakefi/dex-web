import { assign, fromPromise, setup } from "xstate";
import type { LiquidityFormValues } from "../_types/liquidity.types";

/**
 * Machine context follows best practice: only workflow state, no server data.
 * TanStack Query owns all server state (poolDetails, tokenAccounts).
 * TanStack Form owns all form state.
 */
export interface LiquidityMachineContext {
  error: string | null;
  transactionSignature: string | null;
  liquidityStep: number;
  isCalculating: boolean;
}

export type LiquidityMachineEvent =
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "SUBMIT"; data: LiquidityFormValues }
  | { type: "SIGN_TRANSACTION"; signature: string }
  | { type: "SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "RESET" };

export const liquidityMachine = setup({
  actors: {
    submitLiquidity: fromPromise(
      // biome-ignore lint/correctness/noUnusedFunctionParameters: input is required by xstate actor signature
      async ({ input }: { input: { values: LiquidityFormValues } }) => {
        // This will be provided at runtime by useLiquidityTransaction
        return { result: "submitted" };
      },
    ),
  },
  types: {} as {
    context: LiquidityMachineContext;
    events: LiquidityMachineEvent;
  },
}).createMachine({
  context: {
    error: null,
    isCalculating: false,
    liquidityStep: 0,
    transactionSignature: null,
  } as LiquidityMachineContext,
  id: "liquidity",
  initial: "ready",
  states: {
    error: {
      on: {
        RESET: {
          actions: assign({
            error: null,
            isCalculating: false,
            liquidityStep: 0,
            transactionSignature: null,
          }),
          target: "ready.idle",
        },
        RETRY: {
          target: "submitting",
        },
      },
    },
    ready: {
      initial: "idle",
      states: {
        calculating: {
          entry: assign({
            isCalculating: true,
          }),
          on: {
            FINISH_CALCULATION: {
              actions: assign({
                isCalculating: false,
              }),
              target: "idle",
            },
            SUBMIT: {
              target: "#liquidity.submitting",
            },
          },
        },
        idle: {
          on: {
            START_CALCULATION: {
              target: "calculating",
            },
            SUBMIT: {
              target: "#liquidity.submitting",
            },
          },
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
      invoke: {
        input: ({ event }) => ({
          values: (event as { data: LiquidityFormValues }).data,
        }),
        onDone: {
          target: "success",
        },
        onError: {
          actions: assign({
            error: ({ event }) => String(event.error),
            liquidityStep: 0,
          }),
          target: "error",
        },
        src: "submitLiquidity",
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
          target: "ready.idle",
        },
      },
    },
  },
});

export type LiquidityMachine = typeof liquidityMachine;

export type LiquidityState =
  | "ready"
  | "ready.idle"
  | "ready.calculating"
  | "submitting"
  | "signing"
  | "success"
  | "error";

export const isLiquidityState = (state: string): state is LiquidityState => {
  return [
    "ready",
    "ready.idle",
    "ready.calculating",
    "submitting",
    "signing",
    "success",
    "error",
  ].includes(state);
};
