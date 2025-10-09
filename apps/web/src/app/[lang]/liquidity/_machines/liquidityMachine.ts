import { assertEvent, assign, fromPromise, setup } from "xstate";
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
  lastValues: (LiquidityFormValues & { slippage?: string }) | null;
}

export type LiquidityMachineEvent =
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "SUBMIT"; data: LiquidityFormValues & { slippage?: string } }
  | { type: "SIGN_TRANSACTION"; signature: string }
  | { type: "SUCCESS" }
  | { type: "ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "RESET" }
  | { type: "DISMISS" };

export const liquidityMachine = setup({
  actions: {
    resetForm: () => {},
    resetState: assign({
      error: null,
      isCalculating: false,
      lastValues: null,
      liquidityStep: 0,
      transactionSignature: null,
    }),
  },
  actors: {
    submitLiquidity: fromPromise(
      // biome-ignore lint/correctness/noUnusedFunctionParameters: input is required by xstate actor signature
      async ({ input }: { input: LiquidityFormValues }) => {
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
    lastValues: null,
    liquidityStep: 0,
    transactionSignature: null,
  } as LiquidityMachineContext,
  id: "liquidity",
  initial: "ready",
  states: {
    error: {
      on: {
        DISMISS: {
          actions: "resetState",
          target: "ready.idle",
        },
        RESET: {
          actions: "resetState",
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
              actions: assign({
                lastValues: ({ event }) => {
                  assertEvent(event, "SUBMIT");
                  return event.data;
                },
              }),
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
              actions: assign({
                lastValues: ({ event }) => {
                  assertEvent(event, "SUBMIT");
                  return event.data;
                },
              }),
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
        input: ({ context, event }) => {
          assertEvent(event, "SUBMIT");
          return event.data || context.lastValues;
        },
        onDone: {
          target: "success",
        },
        onError: {
          actions: [
            assign({
              error: ({ event }) => String(event.error),
              liquidityStep: 0,
            }),
            ({ event }) =>
              console.error("Liquidity transaction error:", event.error),
          ],
          target: "error",
        },
        src: "submitLiquidity",
      },
    },
    success: {
      on: {
        RESET: {
          actions: ["resetState", "resetForm"],
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
