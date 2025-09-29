"use client";

import {
  ERROR_MESSAGES,
  useLiquidityTracking,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import {
  convertToDecimal,
  formatAmountInput,
  parseAmount,
  parseAmountBigNumber,
  sortSolanaAddresses,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useMachine } from "@xstate/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { useMemo, useState, useCallback, startTransition, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import {
  useWalletAdapter,
  useWalletPublicKey,
} from "../../../../hooks/useWalletCache";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { dismissToast, toast } from "../../../_utils/toast";
import {
  FORM_FIELD_NAMES,
  LIQUIDITY_CONSTANTS,
} from "../_constants/liquidityConstants";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type {
  LiquidityFormValues,
  WalletAdapter,
  LiquidityFormProviderProps,
} from "../_types/liquidity.types";
import {
  LiquidityFormStateProvider,
  LiquidityDataProvider,
  LiquidityActionsProvider,
  LiquidityWalletProvider,
  LiquiditySettingsProvider,
  useLiquidityForm as useCompositeContext,
} from "./LiquidityContexts";
import { liquidityFormSchema } from "../_types/liquidity.types";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import { useLiquidityCalculationWorker } from "../_hooks/useLiquidityCalculationWorker";
import {
  priceCalculationCache,
  balanceValidationCache,
  tokenAmountCache,
  poolRatioCache,
  createPriceCalculationKey,
  createBalanceValidationKey,
  createTokenAmountKey,
  createPoolRatioKey,
  startCacheCleanup,
} from "../_utils/calculationCache";

// Create TanStack Form contexts
export const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

// Enhanced calculation results interface
interface CalculationState {
  isCalculating: boolean;
  lastCalculationTime: number;
  approximateResult?: string;
  hasApproximateResult: boolean;
}

export function OptimizedLiquidityFormProvider({
  children,
  tokenAAddress: propTokenAAddress,
  tokenBAddress: propTokenBAddress,
}: LiquidityFormProviderProps) {
  const { signTransaction } = useWallet();
  const { data: publicKey } = useWalletPublicKey();
  const { data: walletAdapter } = useWalletAdapter() as {
    data: WalletAdapter | null;
  };
  const { trackLiquidity, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const tx = useTranslations("liquidity");

  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const finalTokenAAddress = propTokenAAddress ?? tokenAAddress;
  const finalTokenBAddress = propTokenBAddress ?? tokenBAddress;

  const [slippage, setSlippage] = useState(LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE);
  const [calculationState, setCalculationState] = useState<CalculationState>({
    isCalculating: false,
    lastCalculationTime: 0,
    hasApproximateResult: false,
  });

  // Web Worker for heavy calculations
  const {
    isReady: isWorkerReady,
    isCalculating: isWorkerCalculating,
    calculatePrice,
    validateBalance,
    calculateApproximateTokenAmount,
    cancelPendingCalculations,
    error: workerError,
  } = useLiquidityCalculationWorker();

  // Initialize cache cleanup
  const cacheCleanupRef = useRef<(() => void) | null>(null);
  useMemo(() => {
    if (!cacheCleanupRef.current) {
      cacheCleanupRef.current = startCacheCleanup();
    }
    return () => {
      if (cacheCleanupRef.current) {
        cacheCleanupRef.current();
        cacheCleanupRef.current = null;
      }
    };
  }, []);

  const sortedTokenAddresses = useMemo(() =>
    sortSolanaAddresses(finalTokenAAddress, finalTokenBAddress),
    [finalTokenAAddress, finalTokenBAddress]
  );

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const poolDataResult = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  const tokenAccountsData = useRealtimeTokenAccounts({
    publicKey: publicKey || null,
    tokenAAddress: finalTokenAAddress,
    tokenBAddress: finalTokenBAddress,
  });

  const [state, send] = useMachine(liquidityMachine, {
    input: {
      buyTokenAccount: tokenAccountsData.buyTokenAccount,
      poolDetails: poolDataResult.poolDetails,
      sellTokenAccount: tokenAccountsData.sellTokenAccount,
    },
  });

  const {
    trackInitiated,
    trackSigned,
    trackConfirmed,
    trackFailed,
    trackError: trackLiquidityError,
  } = useLiquidityTracking({
    trackError: (error: unknown, context?: Record<string, unknown>) => {
      trackError({
        context: "liquidity",
        details: context,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    trackLiquidity,
  });

  const transactionToasts = useTransactionToasts({
    customMessages: {
      squadsXFailure: {
        description: tx("squadsX.responseStatus.failed.description"),
        title: tx("squadsX.responseStatus.failed.title"),
      },
      squadsXSuccess: {
        description: tx("squadsX.responseStatus.confirmed.description"),
        title: tx("squadsX.responseStatus.confirmed.title"),
      },
    },
    dismissToast,
    isSquadsX: isSquadsX(walletAdapter?.wallet),
    toast,
    transactionType: "LIQUIDITY",
  });

  const statusChecker = useTransactionStatus({
    checkStatus: async (signature: string) => {
      const response = await client.liquidity.checkLiquidityTransactionStatus({
        signature,
      });
      return {
        data: response,
        error: response.error,
        status: response.status,
      };
    },
    failStates: ["failed"],
    maxAttempts: LIQUIDITY_CONSTANTS.MAX_TRANSACTION_ATTEMPTS,
    onFailure: (result) => {
      handleError(new Error(result.error || "Unknown error"));
    },
    onStatusUpdate: (status, attempt) => {
      transactionToasts.showStatusToast(
        `Finalizing transaction... (${attempt}/${LIQUIDITY_CONSTANTS.MAX_TRANSACTION_ATTEMPTS}) - ${status}`,
      );
    },
    onSuccess: (result) => {
      if (result.error) {
        const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
        const tokenBAmount = parseAmount(form.state.values.tokenBAmount);

        handleError(new Error(result.error), {
          amountA: form.state.values.tokenAAmount,
          amountB: form.state.values.tokenBAmount,
          tokenA: finalTokenAAddress,
          tokenB: finalTokenBAddress,
        });

        trackFailed({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: finalTokenAAddress || "",
          tokenB: finalTokenBAddress || "",
          transactionHash: "",
        });
        return;
      }

      send({ type: "SUCCESS" });
      const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
      const tokenBAmount = parseAmount(form.state.values.tokenBAmount);

      trackConfirmed({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: finalTokenAAddress || "",
        tokenB: finalTokenBAddress || "",
        transactionHash: "",
      });

      const successMessage = !isSquadsX(walletAdapter?.wallet)
        ? `ADDED LIQUIDITY: ${form.state.values.tokenAAmount} ${finalTokenBAddress} + ${form.state.values.tokenBAmount} ${finalTokenAAddress}`
        : undefined;

      transactionToasts.showSuccessToast(successMessage);
      tokenAccountsData.refetchBuyTokenAccount();
      tokenAccountsData.refetchSellTokenAccount();

      // Invalidate token account data
      queryClient.invalidateQueries({
        queryKey: ["token-accounts", publicKey?.toBase58()],
      });

      // Invalidate pool data to ensure fresh pool information after liquidity changes
      const poolKey = `${tokenXMint}-${tokenYMint}`;
      const sortedPoolKey = [tokenXMint, tokenYMint].sort().join("-");

      // Invalidate pool details with custom queryKey patterns
      queryClient.invalidateQueries({
        queryKey: ["pool-details", poolKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["pool-details", sortedPoolKey],
      });

      // Invalidate pool queries using tanstack client queryOptions
      const poolDetailsOpts = tanstackClient.pools.getPoolDetails.queryOptions({
        input: { tokenXMint, tokenYMint },
      });
      const poolReservesOpts = tanstackClient.pools.getPoolReserves.queryOptions({
        input: { tokenXMint, tokenYMint },
      });

      queryClient.invalidateQueries({ queryKey: poolDetailsOpts.queryKey });
      queryClient.invalidateQueries({ queryKey: poolReservesOpts.queryKey });

      // Invalidate pool subscription data for both token orders
      queryClient.invalidateQueries({
        queryKey: ["pool", tokenXMint, tokenYMint],
      });
      queryClient.invalidateQueries({
        queryKey: ["pool", tokenYMint, tokenXMint],
      });
    },
    onTimeout: () => {
      handleError(
        new Error(
          "Transaction may still be processing. Check explorer for status.",
        ),
      );
    },
    retryDelay: LIQUIDITY_CONSTANTS.TRANSACTION_RETRY_DELAY_MS,
    successStates: ["finalized"],
  });

  // Optimized balance validation with caching
  const validateTokenBalance = useCallback(async (
    tokenAmount: string,
    tokenAccount: any
  ): Promise<{ tokenAAmount?: string } | undefined> => {
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
      if (isWorkerReady) {
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
  }, [publicKey, isWorkerReady, validateBalance]);

  const formConfig = useMemo(() => ({
    defaultValues: {
      [FORM_FIELD_NAMES.INITIAL_PRICE]: LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
      [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
      [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
    } satisfies LiquidityFormValues,
    onSubmit: async ({
      value,
    }: {
      value: { tokenAAmount: string; tokenBAmount: string };
    }) => {
      send({ data: value, type: "SUBMIT" });
      await handleDeposit();
    },
    validators: {
      onChange: liquidityFormSchema,
      onDynamic: ({ value }: { value: typeof liquidityFormSchema._type }) => {
        if (value.tokenAAmount) {
          return validateTokenBalance(value.tokenAAmount, tokenAccountsData.buyTokenAccount);
        }
        return undefined;
      },
    },
  }), [publicKey, tokenAccountsData.buyTokenAccount, validateTokenBalance]);

  const form = useAppForm(formConfig);

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>): void => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    send({ error: errorMessage, type: "ERROR" });
    transactionToasts.showErrorToast(errorMessage);

    if (context) {
      trackLiquidityError(error, context);
    }
  }, [send, transactionToasts, trackLiquidityError]);

  const resetFormToDefaults = useCallback((): void => {
    form.setFieldValue("tokenAAmount", "0");
    form.setFieldValue("tokenBAmount", "0");
    form.setFieldValue("initialPrice", "1");

    // Clear calculation state
    setCalculationState({
      isCalculating: false,
      lastCalculationTime: 0,
      hasApproximateResult: false,
    });

    // Cancel any pending calculations
    cancelPendingCalculations();
  }, [form, cancelPendingCalculations]);

  // Optimized calculateTokenAmounts with progressive loading and caching
  const calculateTokenAmounts = useCallback(async ({
    inputAmount,
    inputType,
  }: {
    inputAmount: string;
    inputType: "tokenX" | "tokenY";
  }) => {
    const amountNumber = parseAmount(inputAmount);
    if (!poolDataResult.poolDetails || parseAmountBigNumber(inputAmount).lte(0)) {
      return;
    }

    setCalculationState(prev => ({
      ...prev,
      isCalculating: true,
      lastCalculationTime: Date.now(),
    }));

    try {
      // First, try to provide approximate result from worker if available
      if (isWorkerReady && poolDataResult.poolDetails.tokenXReserve && poolDataResult.poolDetails.tokenYReserve) {
        const cacheKey = createTokenAmountKey(
          inputAmount,
          poolDataResult.poolDetails.tokenXReserve,
          poolDataResult.poolDetails.tokenYReserve,
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

          setCalculationState(prev => ({
            ...prev,
            isCalculating: false,
            approximateResult: cachedResult,
            hasApproximateResult: true,
          }));
          return;
        }

        // Calculate approximate result using worker
        try {
          const approximateResult = await calculateApproximateTokenAmount(
            inputAmount,
            poolDataResult.poolDetails.tokenXReserve,
            poolDataResult.poolDetails.tokenYReserve,
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

          setCalculationState(prev => ({
            ...prev,
            approximateResult,
            hasApproximateResult: true,
          }));
        } catch (workerError) {
          console.warn("Worker calculation failed, falling back to API:", workerError);
        }
      }

      // Then get exact result from API
      const response = await client.liquidity.getAddLiquidityReview({
        isTokenX: inputType === "tokenX",
        tokenAmount: amountNumber,
        tokenXMint: poolDataResult.poolDetails.tokenXMint,
        tokenYMint: poolDataResult.poolDetails.tokenYMint,
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

      setCalculationState(prev => ({
        ...prev,
        isCalculating: false,
        hasApproximateResult: false,
      }));

    } catch (error) {
      console.error("Token amount calculation failed:", error);
      setCalculationState(prev => ({
        ...prev,
        isCalculating: false,
      }));
    }
  }, [
    poolDataResult.poolDetails,
    form,
    isWorkerReady,
    calculateApproximateTokenAmount,
  ]);

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  const clearPendingCalculations = useCallback(() => {
    debouncedCalculateTokenAmounts.cancel();
    cancelPendingCalculations();
    setCalculationState(prev => ({
      ...prev,
      isCalculating: false,
    }));
  }, [debouncedCalculateTokenAmounts, cancelPendingCalculations]);

  // Optimized handleAmountChange with caching for new pool calculations
  const handleAmountChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = formatAmountInput(e.target.value);

    clearPendingCalculations();

    if (e.isTrusted && poolDataResult.poolDetails && parseAmountBigNumber(value).gt(0)) {
      const inputType =
        (type === "sell" && poolDataResult.poolDetails?.tokenXMint === finalTokenBAddress) ||
        (type === "buy" && poolDataResult.poolDetails?.tokenXMint === finalTokenAAddress)
          ? "tokenX"
          : "tokenY";

      debouncedCalculateTokenAmounts({
        inputAmount: value,
        inputType,
      });
    } else if (!poolDataResult.poolDetails) {
      // Handle new pool price calculations with caching
      if (type === "buy") {
        const price = form.state.values.initialPrice || "1";
        if (
          parseAmountBigNumber(value).gt(0) &&
          parseAmountBigNumber(price).gt(0)
        ) {
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
          if (isWorkerReady) {
            calculatePrice(value, price)
              .then((result) => {
                priceCalculationCache.set(cacheKey, result);
                startTransition(() => {
                  form.setFieldValue("tokenBAmount", result);
                });
              })
              .catch((error) => {
                console.warn("Worker price calculation failed:", error);
                // Fallback to sync calculation
                const calculatedTokenB = parseAmountBigNumber(value)
                  .multipliedBy(price)
                  .toString();
                priceCalculationCache.set(cacheKey, calculatedTokenB);
                startTransition(() => {
                  form.setFieldValue("tokenBAmount", calculatedTokenB);
                });
              });
          } else {
            // Sync fallback
            const calculatedTokenB = parseAmountBigNumber(value)
              .multipliedBy(price)
              .toString();
            priceCalculationCache.set(cacheKey, calculatedTokenB);
            startTransition(() => {
              form.setFieldValue("tokenBAmount", calculatedTokenB);
            });
          }
        }
      }
    }
  }, [
    poolDataResult.poolDetails,
    finalTokenAAddress,
    finalTokenBAddress,
    clearPendingCalculations,
    debouncedCalculateTokenAmounts,
    form,
    isWorkerReady,
    calculatePrice,
  ]);

  const checkLiquidityTransactionStatus = useCallback(async (signature: string) => {
    await statusChecker.checkTransactionStatus(signature);
  }, [statusChecker]);

  const handleDeposit = useCallback(async () => {
    if (!publicKey) {
      transactionToasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
      return;
    }

    transactionToasts.showStepToast(1);

    const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
    const tokenBAmount = parseAmount(form.state.values.tokenBAmount);
    trackInitiated({
      action: "add",
      amountA: tokenAAmount,
      amountB: tokenBAmount,
      tokenA: finalTokenAAddress || "",
      tokenB: finalTokenBAddress || "",
    });

    try {
      const finalTokenAAddr = finalTokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
      const finalTokenBAddr = finalTokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

      const sortedTokens = sortSolanaAddresses(
        finalTokenAAddr,
        finalTokenBAddr,
      );

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      if (!walletAdapter?.wallet) {
        throw new Error(ERROR_MESSAGES.MISSING_WALLET);
      }

      if (!tokenXAddress || !tokenYAddress) {
        throw new Error("Invalid token addresses after sorting");
      }

      const sellAmount = parseAmount(form.state.values.tokenBAmount);
      const buyAmount = parseAmount(form.state.values.tokenAAmount);

      const isTokenXSell = poolDataResult.poolDetails?.tokenXMint === finalTokenBAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      const requestPayload = {
        maxAmountX: maxAmountX,
        maxAmountY: maxAmountY,
        slippage: Number(slippage || "0.5"),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      } satisfies CreateLiquidityTransactionInput;

      const response =
        await client.liquidity.createLiquidityTransaction(requestPayload);

      if (response.success && response.transaction) {
        trackSigned({
          action: "add",
          amountA: buyAmount,
          amountB: sellAmount,
          tokenA: finalTokenAAddress || "",
          tokenB: finalTokenBAddress || "",
        });

        requestLiquidityTransactionSigning({
          checkLiquidityTransactionStatus,
          publicKey,
          setLiquidityStep: () => {},
          signTransaction,
          unsignedTransaction: response.transaction,
        });
      } else {
        throw new Error("Failed to create liquidity transaction");
      }
    } catch (error) {
      console.error("Liquidity error:", error);
      handleError(error, {
        amountA: form.state.values.tokenAAmount,
        amountB: form.state.values.tokenBAmount,
        tokenA: finalTokenAAddress,
        tokenB: finalTokenBAddress,
      });
    }
  }, [
    publicKey,
    transactionToasts,
    form.state.values,
    trackInitiated,
    finalTokenAAddress,
    finalTokenBAddress,
    walletAdapter?.wallet,
    poolDataResult.poolDetails,
    slippage,
    trackSigned,
    checkLiquidityTransactionStatus,
    signTransaction,
    handleError,
  ]);

  // State selectors for optimization
  const isSubmitting = state.matches("submitting") || state.matches("signing");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");
  const isCalculating = state.matches("calculating") ||
                       state.context.isCalculating ||
                       calculationState.isCalculating ||
                       isWorkerCalculating;
  const hasError = isError && !!state.context.error;

  // Track liquidity action wrapper
  const trackLiquidityAction = useCallback((data: Parameters<typeof trackConfirmed>[0]) => {
    trackConfirmed(data);
  }, [trackConfirmed]);

  // Prepare context values for each focused provider
  const formStateValue = useMemo(() => ({
    form,
    state: state.context,
    send,
    isSubmitting,
    isSuccess,
    isError,
    isCalculating,
    hasError,
    // Add calculation state for progressive feedback
    calculationState,
    isWorkerReady,
    workerError,
  }), [
    form,
    state.context,
    send,
    isSubmitting,
    isSuccess,
    isError,
    isCalculating,
    hasError,
    calculationState,
    isWorkerReady,
    workerError,
  ]);

  const dataValue = useMemo(() => ({
    poolDetails: poolDataResult.poolDetails,
    tokenAccountsData,
    tokenAAddress: finalTokenAAddress,
    tokenBAddress: finalTokenBAddress,
  }), [poolDataResult.poolDetails, tokenAccountsData, finalTokenAAddress, finalTokenBAddress]);

  const actionsValue = useMemo(() => ({
    resetFormToDefaults,
    handleAmountChange,
    clearPendingCalculations,
    calculateTokenAmounts,
    trackLiquidityAction,
    trackError: trackLiquidityError,
    handleError,
  }), [
    resetFormToDefaults,
    handleAmountChange,
    clearPendingCalculations,
    calculateTokenAmounts,
    trackLiquidityAction,
    trackLiquidityError,
    handleError,
  ]);

  const walletValue = useMemo(() => ({
    publicKey,
    walletAdapter,
  }), [publicKey, walletAdapter]);

  const settingsValue = useMemo(() => ({
    slippage,
    setSlippage,
  }), [slippage, setSlippage]);

  return (
    <LiquidityWalletProvider value={walletValue}>
      <LiquiditySettingsProvider value={settingsValue}>
        <LiquidityDataProvider value={dataValue}>
          <LiquidityActionsProvider value={actionsValue}>
            <LiquidityFormStateProvider value={formStateValue}>
              {children}
            </LiquidityFormStateProvider>
          </LiquidityActionsProvider>
        </LiquidityDataProvider>
      </LiquiditySettingsProvider>
    </LiquidityWalletProvider>
  );
}

// Export the composite hook from LiquidityContexts
export const useOptimizedLiquidityForm = useCompositeContext;

// Also export a debounced version for backward compatibility
export function useOptimizedLiquidityFormWithDebounced() {
  const context = useOptimizedLiquidityForm();
  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    context.calculateTokenAmounts,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  return {
    ...context,
    debouncedCalculateTokenAmounts,
  };
}