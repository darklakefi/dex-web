"use client";

import { client } from "@dex-web/orpc";
import { parseAmount, parseAmountBigNumber } from "@dex-web/utils";
import { useCallback, useRef, useState } from "react";

export interface CalculationParams {
  inputAmount: string;
  inputType: "tokenX" | "tokenY";
  tokenXMint: string;
  tokenYMint: string;
}

export interface CalculationResult {
  tokenAmount: number;
  inputType: "tokenX" | "tokenY";
}

export interface CalculationState {
  result: CalculationResult | null;
  isCalculating: boolean;
  error: string | null;
}

export function useLiquidityCalculations() {
  const [state, setState] = useState<CalculationState>({
    result: null,
    isCalculating: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const calculate = useCallback(async (params: CalculationParams): Promise<CalculationResult | null> => {
    const amountNumber = parseAmount(params.inputAmount);

    if (parseAmountBigNumber(params.inputAmount).lte(0)) {
      setState(prev => ({ ...prev, result: null, error: null }));
      return null;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isCalculating: true, error: null }));

    try {
      const response = await client.liquidity.getAddLiquidityReview({
        isTokenX: params.inputType === "tokenX",
        tokenAmount: amountNumber,
        tokenXMint: params.tokenXMint,
        tokenYMint: params.tokenYMint,
      });

      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        const result: CalculationResult = {
          tokenAmount: response.tokenAmount,
          inputType: params.inputType,
        };

        setState({
          result,
          isCalculating: false,
          error: null,
        });

        return result;
      }
    } catch (error) {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setState({
          result: null,
          isCalculating: false,
          error: error instanceof Error ? error.message : "Calculation failed",
        });
      }
    }

    return null;
  }, []);

  const clearCalculations = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      result: null,
      isCalculating: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    calculate,
    clearCalculations,
  };
}