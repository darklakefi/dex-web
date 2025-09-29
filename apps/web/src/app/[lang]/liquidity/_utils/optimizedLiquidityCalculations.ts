import {
  formatAmountInput,
  parseAmount,
  parseAmountBigNumber,
  convertToDecimal,
} from "@dex-web/utils";
import { client } from "@dex-web/orpc";
import { startTransition } from "react";
import type { FormApi } from "@tanstack/react-form";
import type { LiquidityFormValues } from "../_types/liquidity.types";
import {
  priceCalculationCache,
  balanceValidationCache,
  tokenAmountCache,
  createPriceCalculationKey,
  createBalanceValidationKey,
  createTokenAmountKey,
} from "./calculationCache";

// Enhanced balance validation with caching
export async function validateTokenBalanceOptimized(
  tokenAmount: string,
  tokenAccount: any,
  publicKey: any,
  validateBalance?: (inputAmount: string, maxBalance: number, decimals: number, symbol: string) => Promise<{ isValid: boolean; error?: string }>,
  isWorkerReady: boolean = false
): Promise<{ tokenAAmount?: string } | undefined> {
  if (!tokenAmount || !publicKey || !tokenAccount?.tokenAccounts?.[0]) {
    return undefined;
  }

  const tokenANumericValue = formatAmountInput(tokenAmount);
  if (!parseAmountBigNumber(tokenANumericValue).gt(0)) {
    return undefined;
  }

  const account = tokenAccount.tokenAccounts[0];
  const cacheKey = createBalanceValidationKey(
    tokenANumericValue,
    account.amount || 0,
    account.decimals || 0,
    account.symbol || "token"
  );

  // Check cache first
  const cachedResult = balanceValidationCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult.isValid ? undefined : { tokenAAmount: cachedResult.error };
  }

  try {
    // Use Web Worker for validation if available, otherwise fall back to sync
    if (isWorkerReady && validateBalance) {
      const result = await validateBalance(
        tokenANumericValue,
        account.amount || 0,
        account.decimals || 0,
        account.symbol || "token"
      );

      // Cache the result
      balanceValidationCache.set(cacheKey, result);

      return result.isValid ? undefined : { tokenAAmount: result.error };
    } else {
      // Fallback sync validation
      const maxBalance = convertToDecimal(
        account.amount || 0,
        account.decimals || 0,
      );

      if (parseAmountBigNumber(tokenANumericValue).gt(maxBalance)) {
        const symbol = account.symbol || "token";
        const error = `Insufficient ${symbol} balance.`;

        // Cache the result
        balanceValidationCache.set(cacheKey, { isValid: false, error });

        return { tokenAAmount: error };
      }

      // Cache successful validation
      balanceValidationCache.set(cacheKey, { isValid: true });
      return undefined;
    }
  } catch (error) {
    console.warn("Balance validation failed:", error);
    // Return fallback error
    const fallbackError = "Balance validation failed";
    balanceValidationCache.set(cacheKey, { isValid: false, error: fallbackError });
    return { tokenAAmount: fallbackError };
  }
}

// Enhanced token amount calculation with progressive loading
export async function calculateTokenAmountsOptimized({
  inputAmount,
  inputType,
  poolDetails,
  form,
  isWorkerReady = false,
  calculateApproximateTokenAmount,
  setCalculationState,
}: {
  inputAmount: string;
  inputType: "tokenX" | "tokenY";
  poolDetails: any;
  form: FormApi<LiquidityFormValues, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>;
  isWorkerReady?: boolean;
  calculateApproximateTokenAmount?: (
    inputAmount: string,
    poolReserveX: number,
    poolReserveY: number,
    inputType: 'tokenX' | 'tokenY'
  ) => Promise<string>;
  setCalculationState?: (updater: (prev: any) => any) => void;
}) {
  const amountNumber = parseAmount(inputAmount);
  if (!poolDetails || parseAmountBigNumber(inputAmount).lte(0)) {
    return;
  }

  if (setCalculationState) {
    setCalculationState((prev: any) => ({
      ...prev,
      isCalculating: true,
      lastCalculationTime: Date.now(),
    }));
  }

  try {
    // First, try to provide approximate result from worker if available
    if (isWorkerReady && poolDetails.tokenXReserve && poolDetails.tokenYReserve && calculateApproximateTokenAmount) {
      const cacheKey = createTokenAmountKey(
        inputAmount,
        poolDetails.tokenXReserve,
        poolDetails.tokenYReserve,
        inputType
      );

      // Check cache first
      const cachedResult = tokenAmountCache.get(cacheKey);
      if (cachedResult) {
        startTransition(() => {
          if (inputType === "tokenX") {
            form.setFieldValue("tokenBAmount", cachedResult);
          } else {
            form.setFieldValue("tokenAAmount", cachedResult);
          }
          form.validateAllFields("change");
        });

        if (setCalculationState) {
          setCalculationState((prev: any) => ({
            ...prev,
            isCalculating: false,
            approximateResult: cachedResult,
            hasApproximateResult: true,
          }));
        }
        return;
      }

      // Calculate approximate result using worker
      try {
        const approximateResult = await calculateApproximateTokenAmount(
          inputAmount,
          poolDetails.tokenXReserve,
          poolDetails.tokenYReserve,
          inputType
        );

        // Cache and apply approximate result immediately
        tokenAmountCache.set(cacheKey, approximateResult);

        startTransition(() => {
          if (inputType === "tokenX") {
            form.setFieldValue("tokenBAmount", approximateResult);
          } else {
            form.setFieldValue("tokenAAmount", approximateResult);
          }
          form.validateAllFields("change");
        });

        if (setCalculationState) {
          setCalculationState((prev: any) => ({
            ...prev,
            approximateResult,
            hasApproximateResult: true,
          }));
        }
      } catch (workerError) {
        console.warn("Worker calculation failed, falling back to API:", workerError);
      }
    }

    // Then get exact result from API
    const response = await client.liquidity.getAddLiquidityReview({
      isTokenX: inputType === "tokenX",
      tokenAmount: amountNumber,
      tokenXMint: poolDetails.tokenXMint,
      tokenYMint: poolDetails.tokenYMint,
    });

    // Apply exact result
    startTransition(() => {
      if (inputType === "tokenX") {
        form.setFieldValue("tokenBAmount", String(response.tokenAmount));
      } else {
        form.setFieldValue("tokenAAmount", String(response.tokenAmount));
      }
      form.validateAllFields("change");
    });

    if (setCalculationState) {
      setCalculationState((prev: any) => ({
        ...prev,
        isCalculating: false,
        hasApproximateResult: false,
      }));
    }

  } catch (error) {
    console.error("Token amount calculation failed:", error);
    if (setCalculationState) {
      setCalculationState((prev: any) => ({
        ...prev,
        isCalculating: false,
      }));
    }
  }
}

// Enhanced price calculation with caching for new pools
export async function calculatePriceWithCaching(
  value: string,
  price: string,
  form: FormApi<LiquidityFormValues, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>,
  calculatePrice?: (inputAmount: string, price: string) => Promise<string>,
  isWorkerReady: boolean = false
) {
  if (!parseAmountBigNumber(value).gt(0) || !parseAmountBigNumber(price).gt(0)) {
    return;
  }

  const cacheKey = createPriceCalculationKey(value, price);

  // Check cache first
  const cachedResult = priceCalculationCache.get(cacheKey);
  if (cachedResult) {
    startTransition(() => {
      form.setFieldValue("tokenBAmount", cachedResult);
    });
    return;
  }

  // Calculate with worker if available
  if (isWorkerReady && calculatePrice) {
    try {
      const result = await calculatePrice(value, price);
      priceCalculationCache.set(cacheKey, result);
      startTransition(() => {
        form.setFieldValue("tokenBAmount", result);
      });
      return;
    } catch (error) {
      console.warn("Worker price calculation failed:", error);
      // Fall through to sync calculation
    }
  }

  // Sync fallback
  const calculatedTokenB = parseAmountBigNumber(value)
    .multipliedBy(price)
    .toString();
  priceCalculationCache.set(cacheKey, calculatedTokenB);
  startTransition(() => {
    form.setFieldValue("tokenBAmount", calculatedTokenB);
  });
}

// Debounced calculation wrapper with state management
export function createOptimizedCalculationWrapper(
  originalCalculateTokenAmounts: any,
  debouncedCalculateTokenAmounts: any,
  cancelPendingCalculations: () => void,
  setCalculationState: (updater: (prev: any) => any) => void
) {
  return {
    clearPendingCalculations: () => {
      debouncedCalculateTokenAmounts.cancel();
      cancelPendingCalculations();
      setCalculationState((prev: any) => ({
        ...prev,
        isCalculating: false,
      }));
    },
    calculateTokenAmounts: originalCalculateTokenAmounts,
    debouncedCalculateTokenAmounts,
  };
}