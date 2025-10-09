import { useMachine } from "@xstate/react";
import { fromPromise } from "xstate";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type { LiquidityFormValues } from "../_types/liquidity.types";

export interface UseLiquidityTransactionCoreParams {
  form?: { reset: () => void };
  submitTransaction: (input: { values: LiquidityFormValues }) => Promise<void>;
}

export function useLiquidityTransactionCore({
  form,
  submitTransaction,
}: UseLiquidityTransactionCoreParams) {
  const [state, send] = useMachine(
    liquidityMachine.provide({
      actions: {
        resetForm: () => form?.reset(),
      },
      actors: {
        submitLiquidity: fromPromise(async ({ input }) => {
          await submitTransaction({ values: input });
          return { result: "submitted" };
        }),
      },
    }),
  );

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
