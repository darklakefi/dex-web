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
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { dismissToast, toast } from "../../../_utils/toast";
import {
  FORM_FIELD_NAMES,
  LIQUIDITY_CONSTANTS,
} from "../_constants/liquidityConstants";
import { useLiquidityCalculationWorker } from "../_hooks/useLiquidityCalculationWorker";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type {
  LiquidityFormProviderProps,
  LiquidityFormValues,
  WalletAdapter,
} from "../_types/liquidity.types";
import { liquidityFormSchema } from "../_types/liquidity.types";
import { startCacheCleanup } from "../_utils/calculationCache";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import {
  LiquidityActionsProvider,
  LiquidityDataProvider,
  LiquidityFormStateProvider,
  LiquiditySettingsProvider,
  LiquidityWalletProvider,
  useLiquidityForm as useCompositeContext,
} from "./LiquidityContexts";
import type { LiquidityFormStateContextValue } from "./LiquidityContexts";

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

export function LiquidityFormProvider({
  children,
  tokenAAddress: propTokenAAddress,
  tokenBAddress: propTokenBAddress,
}: LiquidityFormProviderProps) {
  const { signTransaction, wallet } = useWallet();
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

  const [slippage, setSlippage] = useState<string>(
    LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
  );

  const {
    isReady: _isWorkerReady,
    isCalculating: _isWorkerCalculating,
    calculatePrice: _calculatePrice,
    validateBalance: _validateBalance,
    calculateApproximateTokenAmount: _calculateApproximateTokenAmount,
    cancelPendingCalculations: _cancelPendingCalculations,
    error: _workerError,
  } = useLiquidityCalculationWorker();

  const [_calculationState, _setCalculationState] = useState({
    approximateResult: undefined as string | undefined,
    hasApproximateResult: false,
    isCalculating: false,
    lastCalculationTime: 0,
  });

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

  const sortedTokenAddresses = useMemo(
    () => sortSolanaAddresses(finalTokenAAddress, finalTokenBAddress),
    [finalTokenAAddress, finalTokenBAddress],
  );

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const poolDataResult = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  const [state, send] = useMachine(liquidityMachine, {
    input: {
      buyTokenAccount: null,
      poolDetails: poolDataResult.data,
      sellTokenAccount: null,
    },
  });

  const hasRecentTransaction = state.matches("success");

  const tokenAccountsData = useRealtimeTokenAccounts({
    publicKey: publicKey || null,
    tokenAAddress: finalTokenAAddress,
    tokenBAddress: finalTokenBAddress,
    hasRecentTransaction,
  });

  useEffect(() => {
    send({
      type: "UPDATE_TOKEN_ACCOUNTS",
      buyAccount: tokenAccountsData.buyTokenAccount ?? null,
      sellAccount: tokenAccountsData.sellTokenAccount ?? null,
    });
  }, [send, tokenAccountsData.buyTokenAccount, tokenAccountsData.sellTokenAccount]);

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
    isSquadsX: isSquadsX(wallet),
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

      const successMessage = !isSquadsX(wallet)
        ? `ADDED LIQUIDITY: ${form.state.values.tokenAAmount} ${finalTokenBAddress} + ${form.state.values.tokenBAmount} ${finalTokenAAddress}`
        : undefined;

      transactionToasts.showSuccessToast(successMessage);
      tokenAccountsData.refetchBuyTokenAccount();
      tokenAccountsData.refetchSellTokenAccount();

      queryClient.invalidateQueries({
        queryKey: ["token-accounts", publicKey?.toBase58()],
      });

      const poolKey = `${tokenXMint}-${tokenYMint}`;
      const sortedPoolKey = [tokenXMint, tokenYMint].sort().join("-");

      queryClient.invalidateQueries({
        queryKey: ["pool-details", poolKey],
      });
      queryClient.invalidateQueries({
        queryKey: ["pool-details", sortedPoolKey],
      });

      const poolDetailsOpts = tanstackClient.pools.getPoolDetails.queryOptions({
        input: { tokenXMint, tokenYMint },
      });
      const poolReservesOpts =
        tanstackClient.pools.getPoolReserves.queryOptions({
          input: { tokenXMint, tokenYMint },
        });

      queryClient.invalidateQueries({ queryKey: poolDetailsOpts.queryKey });
      queryClient.invalidateQueries({ queryKey: poolReservesOpts.queryKey });

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

  const formConfig = useMemo(
    () => ({
      defaultValues: {
        [FORM_FIELD_NAMES.INITIAL_PRICE]:
          LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
        [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
      } as LiquidityFormValues,
      onSubmit: async ({ value }: { value: LiquidityFormValues }) => {
        send({ data: value, type: "SUBMIT" });
        await handleDeposit(value);
      },
      validators: {
        onChange: liquidityFormSchema,
        onDynamic: ({ value }: { value: typeof liquidityFormSchema._type }) => {
          if (
            value.tokenAAmount &&
            publicKey &&
            tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]
          ) {
            const tokenANumericValue = formatAmountInput(value.tokenAAmount);
            if (parseAmountBigNumber(tokenANumericValue).gt(0)) {
              const tokenAccount =
                tokenAccountsData.buyTokenAccount.tokenAccounts[0];
              const maxBalance = convertToDecimal(
                tokenAccount.amount || 0,
                tokenAccount.decimals || 0,
              );

              if (parseAmountBigNumber(tokenANumericValue).gt(maxBalance)) {
                const symbol = tokenAccount.symbol || "token";
                return { tokenAAmount: `Insufficient ${symbol} balance.` };
              }
            }
          }
        },
      },
    }),
    [publicKey, tokenAccountsData.buyTokenAccount, send],
  );

  const form = useAppForm(formConfig);

  const handleError = useCallback(
    (error: unknown, context?: Record<string, unknown>): void => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      send({ error: errorMessage, type: "ERROR" });
      transactionToasts.showErrorToast(errorMessage);

      if (context) {
        trackLiquidityError(error, context);
      }
    },
    [send, transactionToasts, trackLiquidityError],
  );

  const resetFormToDefaults = useCallback((): void => {
    form.setFieldValue("tokenAAmount", "0");
    form.setFieldValue("tokenBAmount", "0");
    form.setFieldValue("initialPrice", "1");
  }, [form]);

  const calculateTokenAmounts = useCallback(
    async ({
      inputAmount,
      inputType,
    }: {
      inputAmount: string;
      inputType: "tokenX" | "tokenY";
    }) => {
      const amountNumber = parseAmount(inputAmount);
      if (
        !poolDataResult.data ||
        parseAmountBigNumber(inputAmount).lte(0)
      )
        return;

      const response = await client.liquidity.getAddLiquidityReview({
        isTokenX: inputType === "tokenX",
        tokenAmount: amountNumber,
        tokenXMint: poolDataResult.data.tokenXMint,
        tokenYMint: poolDataResult.data.tokenYMint,
      });

      startTransition(() => {
        if (inputType === "tokenX") {
          form.setFieldValue("tokenBAmount", String(response.tokenAmount));
          form.validateAllFields("change");
        } else {
          form.setFieldValue("tokenAAmount", String(response.tokenAmount));
          form.validateAllFields("change");
        }
      });
    },
    [poolDataResult.data, form],
  );

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  const clearPendingCalculations = useCallback(() => {
    debouncedCalculateTokenAmounts.cancel();
  }, [debouncedCalculateTokenAmounts]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: "buy" | "sell") => {
      const value = formatAmountInput(e.target.value);

      clearPendingCalculations();

      if (
        e.isTrusted &&
        poolDataResult.data &&
        parseAmountBigNumber(value).gt(0)
      ) {
        const inputType =
          (type === "sell" &&
            poolDataResult.data?.tokenXMint === finalTokenBAddress) ||
          (type === "buy" &&
            poolDataResult.data?.tokenXMint === finalTokenAAddress)
            ? "tokenX"
            : "tokenY";

        debouncedCalculateTokenAmounts({
          inputAmount: value,
          inputType,
        });
      } else if (!poolDataResult.data) {
        if (type === "buy") {
          const price = form.state.values.initialPrice || "1";
          if (
            parseAmountBigNumber(value).gt(0) &&
            parseAmountBigNumber(price).gt(0)
          ) {
            const calculatedTokenB = parseAmountBigNumber(value)
              .multipliedBy(price)
              .toString();
            startTransition(() => {
              form.setFieldValue("tokenBAmount", calculatedTokenB);
            });
          }
        }
      }
    },
    [
      poolDataResult.data,
      finalTokenAAddress,
      finalTokenBAddress,
      clearPendingCalculations,
      debouncedCalculateTokenAmounts,
      form,
    ],
  );

  const checkLiquidityTransactionStatus = useCallback(
    async (signature: string) => {
      await statusChecker.checkTransactionStatus(signature);
    },
    [statusChecker],
  );

  const handleDeposit = useCallback(
    async (formValues?: LiquidityFormValues) => {
      if (!publicKey) {
        transactionToasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
        return;
      }

      transactionToasts.showStepToast(1);

      const values = formValues || form.state.values;
      const tokenAAmount = parseAmount(values.tokenAAmount);
      const tokenBAmount = parseAmount(values.tokenBAmount);
      trackInitiated({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: finalTokenAAddress || "",
        tokenB: finalTokenBAddress || "",
      });

      try {
        const finalTokenAAddr = finalTokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
        const finalTokenBAddr =
          finalTokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

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

        const sellAmount = parseAmount(values.tokenBAmount);
        const buyAmount = parseAmount(values.tokenAAmount);

        const isTokenXSell =
          poolDataResult.data?.tokenXMint === finalTokenBAddress;
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
          amountA: values.tokenAAmount,
          amountB: values.tokenBAmount,
          tokenA: finalTokenAAddress,
          tokenB: finalTokenBAddress,
        });
      }
    },
    [
      publicKey,
      transactionToasts,
      form.state.values,
      trackInitiated,
      finalTokenAAddress,
      finalTokenBAddress,
      walletAdapter?.wallet,
      poolDataResult.data?.tokenXMint,
      slippage,
      trackSigned,
      checkLiquidityTransactionStatus,
      signTransaction,
      handleError,
    ],
  );

  const isSubmitting = state.matches("submitting") || state.matches("signing");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");
  const isCalculating =
    state.matches("calculating");
  const hasError = isError && !!state.context.error;

  const trackLiquidityAction = useCallback(
    (data: Parameters<typeof trackConfirmed>[0]) => {
      trackConfirmed(data);
    },
    [trackConfirmed],
  );

  const formStateValue = useMemo(
    () => ({
      form,
      hasError,
      isCalculating,
      isError,
      isSubmitting,
      isSuccess,
      send,
      state,
    }),
    [
      form,
      state,
      send,
      isSubmitting,
      isSuccess,
      isError,
      isCalculating,
      hasError,
    ],
  );

  const dataValue = useMemo(
    () => ({
      poolDetails: poolDataResult.data,
      tokenAAddress: finalTokenAAddress,
      tokenAccountsData,
      tokenBAddress: finalTokenBAddress,
    }),
    [
      poolDataResult.data,
      tokenAccountsData,
      finalTokenAAddress,
      finalTokenBAddress,
    ],
  );

  const actionsValue = useMemo(
    () => ({
      calculateTokenAmounts,
      clearPendingCalculations,
      handleAmountChange,
      handleError,
      resetFormToDefaults,
      trackError: trackLiquidityError,
      trackLiquidityAction,
    }),
    [
      resetFormToDefaults,
      handleAmountChange,
      clearPendingCalculations,
      calculateTokenAmounts,
      trackLiquidityAction,
      trackLiquidityError,
      handleError,
    ],
  );

  const walletValue = useMemo(
    () => ({
      publicKey: publicKey || null,
      walletAdapter,
    }),
    [publicKey, walletAdapter],
  );

  const settingsValue = useMemo(
    () => ({
      setSlippage,
      slippage,
    }),
    [slippage],
  );

  return (
    <LiquidityWalletProvider value={walletValue}>
      <LiquiditySettingsProvider value={settingsValue}>
        <LiquidityDataProvider value={dataValue}>
          <LiquidityActionsProvider value={actionsValue}>
            <LiquidityFormStateProvider value={formStateValue as unknown as LiquidityFormStateContextValue}>
              {children}
            </LiquidityFormStateProvider>
          </LiquidityActionsProvider>
        </LiquidityDataProvider>
      </LiquiditySettingsProvider>
    </LiquidityWalletProvider>
  );
}

export const useLiquidityForm = useCompositeContext;

export function useLiquidityFormWithDebounced() {
  const context = useLiquidityForm();
  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    context.calculateTokenAmounts,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  return {
    ...context,
    debouncedCalculateTokenAmounts,
  };
}
