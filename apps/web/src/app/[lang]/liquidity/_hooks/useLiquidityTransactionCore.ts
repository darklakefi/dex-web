import { useMachine } from "@xstate/react";
import { fromPromise } from "xstate";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type { LiquidityFormValues } from "../_types/liquidity.types";

export interface UseLiquidityTransactionCoreParams {
  submitTransaction: (input: { values: LiquidityFormValues }) => Promise<void>;
  resetForm?: () => void;
}

/**
 * Core XState machine integration for liquidity transactions.
 *
 * This hook follows Answer #4 best practice: The XState actor calls the mutation directly.
 * The machine is the single source of truth for workflow state (idle → submitting → success/error).
 *
 * Benefits:
 * - Declarative workflow definition in the machine
 * - Easy to visualize and debug state transitions
 * - Clear separation: XState owns workflow, TanStack Query owns server state
 */
export function useLiquidityTransactionCore({
  submitTransaction,
  resetForm,
}: UseLiquidityTransactionCoreParams) {
  const [state, send] = useMachine(
    liquidityMachine.provide({
      actions: {
        // Provide form reset action at runtime
        resetForm: () => resetForm?.(),
      },
      actors: {
        // The machine actor invokes the mutation via submitTransaction
        // This keeps the workflow logic self-contained in the machine definition
        submitLiquidity: fromPromise(async ({ input }) => {
          await submitTransaction({ values: input });
          return { result: "submitted" };
        }),
      },
    }),
  );

  // Derived state selectors
  const isSubmitting = state.matches("submitting");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");
  const isCalculating = state.matches({ ready: "calculating" });
  const isReady = state.matches("ready");

  return {
    isCalculating,
    isError,
    isReady,
    isSubmitting,
    isSuccess,
    send,
    state,
  };
}
