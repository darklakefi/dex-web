import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BalanceValidationPayload,
  CalculationInput,
  CalculationResult,
  PriceCalculationPayload,
  TokenAmountCalculationPayload,
} from "../_workers/liquidityCalculationWorker";

interface WorkerState {
  isReady: boolean;
  isCalculating: boolean;
  error: string | null;
}

export function useLiquidityCalculationWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<WorkerState>({
    error: null,
    isCalculating: false,
    isReady: false,
  });

  const pendingCalculations = useRef<
    Map<
      string,
      {
        resolve: (result: unknown) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
      }
    >
  >(new Map());

  useEffect(() => {
    try {
      workerRef.current = new Worker(
        new URL("../_workers/liquidityCalculationWorker.ts", import.meta.url),
        { type: "module" },
      );

      workerRef.current.onmessage = (
        event: MessageEvent<CalculationResult>,
      ) => {
        const { type, success, result, error, timestamp } = event.data;

        if (type === "WORKER_READY") {
          setState((prev) => ({ ...prev, error: null, isReady: true }));
          return;
        }

        const calculationKey = `${type}-${timestamp}`;
        const pendingCalc = pendingCalculations.current.get(calculationKey);

        if (pendingCalc) {
          clearTimeout(pendingCalc.timeout);
          pendingCalculations.current.delete(calculationKey);

          if (success) {
            pendingCalc.resolve(result);
          } else {
            pendingCalc.reject(new Error(error || "Calculation failed"));
          }
        }

        setState((prev) => ({
          ...prev,
          error: success ? null : error || "Calculation failed",
          isCalculating: pendingCalculations.current.size > 0,
        }));
      };

      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error);
        setState((prev) => ({
          ...prev,
          error: "Worker failed to initialize",
          isReady: false,
        }));
      };

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        pendingCalculations.current.forEach(({ timeout, reject }) => {
          clearTimeout(timeout);
          reject(new Error("Worker terminated"));
        });
        pendingCalculations.current.clear();
      };
    } catch (error) {
      console.error("Failed to create worker:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to create calculation worker",
      }));
    }
  }, []);

  const calculate = useCallback(
    <T>(
      type: CalculationInput["type"],
      payload:
        | PriceCalculationPayload
        | BalanceValidationPayload
        | TokenAmountCalculationPayload,
      timeoutMs: number = 5000,
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !state.isReady) {
          reject(new Error("Worker not ready"));
          return;
        }

        const timestamp = Date.now();
        const calculationKey = `${type}-${timestamp}`;

        const timeout = setTimeout(() => {
          pendingCalculations.current.delete(calculationKey);
          reject(new Error("Calculation timeout"));
        }, timeoutMs);

        pendingCalculations.current.set(calculationKey, {
          reject,
          resolve,
          timeout,
        });

        setState((prev) => ({ ...prev, isCalculating: true }));

        workerRef.current.postMessage({
          payload: { ...payload, timestamp },
          type,
        } as CalculationInput);
      });
    },
    [state.isReady],
  );

  const calculatePrice = useCallback(
    (inputAmount: string, price: string): Promise<string> => {
      return calculate<string>("PRICE_CALCULATION", {
        inputAmount,
        price,
      } as PriceCalculationPayload);
    },
    [calculate],
  );

  const validateBalance = useCallback(
    (
      inputAmount: string,
      maxBalance: number,
      decimals: number,
      symbol: string,
    ): Promise<{ isValid: boolean; error?: string }> => {
      return calculate<{ isValid: boolean; error?: string }>(
        "BALANCE_VALIDATION",
        {
          decimals,
          inputAmount,
          maxBalance,
          symbol,
        } as BalanceValidationPayload,
      );
    },
    [calculate],
  );

  const calculateApproximateTokenAmount = useCallback(
    (
      inputAmount: string,
      poolReserveX: number,
      poolReserveY: number,
      inputType: "tokenX" | "tokenY",
    ): Promise<string> => {
      return calculate<string>("TOKEN_AMOUNT_CALCULATION", {
        inputAmount,
        inputType,
        poolReserveX,
        poolReserveY,
      } as TokenAmountCalculationPayload);
    },
    [calculate],
  );

  const cancelPendingCalculations = useCallback(() => {
    pendingCalculations.current.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error("Calculation cancelled"));
    });
    pendingCalculations.current.clear();
    setState((prev) => ({ ...prev, isCalculating: false }));
  }, []);

  return {
    calculateApproximateTokenAmount,

    calculatePrice,
    cancelPendingCalculations,
    error: state.error,
    isCalculating: state.isCalculating,
    isReady: state.isReady,
    validateBalance,
  };
}
