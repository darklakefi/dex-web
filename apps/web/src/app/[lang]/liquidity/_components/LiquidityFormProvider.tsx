"use client";

import {
  ERROR_MESSAGES,
  useLiquidityTracking,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
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
import { createContext, useContext, useMemo, useState, useCallback } from "react";
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
import { enhancedLiquidityMachine } from "../_machines/enhancedLiquidityMachine";
import {
  type LiquidityFormContextValue,
  type LiquidityFormProviderProps,
  type LiquidityFormValues,
  type WalletAdapter,
  liquidityFormSchema,
} from "../_types/enhanced.types";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";

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


const LiquidityFormContext = createContext<LiquidityFormContextValue | null>(null);

export function LiquidityFormProvider({
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

  // Get token addresses from URL params or props
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const finalTokenAAddress = propTokenAAddress ?? tokenAAddress;
  const finalTokenBAddress = propTokenBAddress ?? tokenBAddress;

  const [slippage, setSlippage] = useState(LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE);

  // Sort token addresses for pool lookup
  const sortedTokenAddresses = useMemo(() =>
    sortSolanaAddresses(finalTokenAAddress, finalTokenBAddress),
    [finalTokenAAddress, finalTokenBAddress]
  );

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  // Pool data hook
  const poolDataResult = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  // Token accounts hook
  const tokenAccountsData = useRealtimeTokenAccounts({
    publicKey: publicKey || null,
    tokenAAddress: finalTokenAAddress,
    tokenBAddress: finalTokenBAddress,
  });

  // XState machine
  const [state, send] = useMachine(enhancedLiquidityMachine, {
    input: {
      buyTokenAccount: tokenAccountsData.buyTokenAccount,
      poolDetails: poolDataResult.poolDetails,
      sellTokenAccount: tokenAccountsData.sellTokenAccount,
    },
  });

  // Analytics and tracking
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

  // Transaction toasts
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

  // Transaction status checker
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
      queryClient.invalidateQueries({
        queryKey: ["token-accounts", publicKey?.toBase58()],
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

  // TanStack Form configuration
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
        if (
          value.tokenAAmount &&
          publicKey &&
          tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]
        ) {
          const tokenANumericValue = formatAmountInput(value.tokenAAmount);
          if (parseAmountBigNumber(tokenANumericValue).gt(0)) {
            const tokenAccount = tokenAccountsData.buyTokenAccount.tokenAccounts[0];
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
  }), [publicKey, tokenAccountsData.buyTokenAccount]);

  const form = useAppForm(formConfig);

  // Error handling
  const handleError = useCallback((error: unknown, context?: Record<string, unknown>): void => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    send({ error: errorMessage, type: "ERROR" });
    transactionToasts.showErrorToast(errorMessage);

    if (context) {
      trackLiquidityError(error, context);
    }
  }, [send, transactionToasts, trackLiquidityError]);

  // Form helpers
  const resetFormToDefaults = useCallback((): void => {
    form.setFieldValue("tokenAAmount", "0");
    form.setFieldValue("tokenBAmount", "0");
    form.setFieldValue("initialPrice", "1");
  }, [form]);

  // Calculate token amounts with debouncing
  const calculateTokenAmounts = useCallback(async ({
    inputAmount,
    inputType,
  }: {
    inputAmount: string;
    inputType: "tokenX" | "tokenY";
  }) => {
    const amountNumber = parseAmount(inputAmount);
    if (!poolDataResult.poolDetails || parseAmountBigNumber(inputAmount).lte(0)) return;

    const response = await client.liquidity.getAddLiquidityReview({
      isTokenX: inputType === "tokenX",
      tokenAmount: amountNumber,
      tokenXMint: poolDataResult.poolDetails.tokenXMint,
      tokenYMint: poolDataResult.poolDetails.tokenYMint,
    });

    if (inputType === "tokenX") {
      form.setFieldValue("tokenBAmount", String(response.tokenAmount));
      form.validateAllFields("change");
    } else {
      form.setFieldValue("tokenAAmount", String(response.tokenAmount));
      form.validateAllFields("change");
    }
  }, [poolDataResult.poolDetails, form]);

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  const clearPendingCalculations = useCallback(() => {
    debouncedCalculateTokenAmounts.cancel();
  }, [debouncedCalculateTokenAmounts]);

  // Handle amount changes
  const handleAmountChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = formatAmountInput(e.target.value);

    // Cancel pending calculations when user manually inputs
    clearPendingCalculations();

    // Only trigger calculations for actual user input, not programmatic changes
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
      if (type === "buy") {
        const price = form.state.values.initialPrice || "1";
        if (
          parseAmountBigNumber(value).gt(0) &&
          parseAmountBigNumber(price).gt(0)
        ) {
          const calculatedTokenB = parseAmountBigNumber(value)
            .multipliedBy(price)
            .toString();
          form.setFieldValue("tokenBAmount", calculatedTokenB);
        }
      }
    }
  }, [poolDataResult.poolDetails, finalTokenAAddress, finalTokenBAddress, clearPendingCalculations, debouncedCalculateTokenAmounts, form]);

  // Transaction status checker function
  const checkLiquidityTransactionStatus = useCallback(async (signature: string) => {
    await statusChecker.checkTransactionStatus(signature);
  }, [statusChecker]);

  // Handle deposit transaction
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
  const isSubmitting = useMemo(() => state.matches("submitting") || state.matches("signing"), [state]);
  const isSuccess = useMemo(() => state.matches("success"), [state]);
  const isError = useMemo(() => state.matches("error"), [state]);
  const isCalculating = useMemo(() => state.matches("calculating") || state.context.isCalculating, [state]);
  const hasError = useMemo(() => isError && !!state.context.error, [isError, state.context.error]);

  // Track liquidity action wrapper
  const trackLiquidityAction = useCallback((data: Parameters<typeof trackConfirmed>[0]) => {
    trackConfirmed(data);
  }, [trackConfirmed]);

  // Context value with proper memoization
  const contextValue = useMemo((): LiquidityFormContextValue => ({
    // TanStack Form instance
    form,

    // XState machine
    state: state.context,
    send,

    // State selectors for optimization
    isSubmitting,
    isSuccess,
    isError,
    isCalculating,
    hasError,

    // Wallet and user data
    publicKey,
    walletAdapter,

    // Token addresses and data
    tokenAAddress: finalTokenAAddress,
    tokenBAddress: finalTokenBAddress,
    poolDetails: poolDataResult.poolDetails,
    tokenAccountsData,

    // Transaction management
    transactionToasts,
    statusChecker: {
      checkTransactionStatus: checkLiquidityTransactionStatus,
    },
    slippage,
    setSlippage,

    // Form helpers
    resetFormToDefaults,
    handleAmountChange,
    clearPendingCalculations,
    calculateTokenAmounts,

    // Analytics and tracking
    trackLiquidityAction,
    trackError: trackLiquidityError,

    // Error handling
    handleError,
  }), [
    form,
    state.context,
    send,
    isSubmitting,
    isSuccess,
    isError,
    isCalculating,
    hasError,
    publicKey,
    walletAdapter,
    finalTokenAAddress,
    finalTokenBAddress,
    poolDataResult.poolDetails,
    tokenAccountsData,
    transactionToasts,
    checkLiquidityTransactionStatus,
    slippage,
    setSlippage,
    resetFormToDefaults,
    handleAmountChange,
    clearPendingCalculations,
    calculateTokenAmounts,
    trackLiquidityAction,
    trackLiquidityError,
    handleError,
  ]);

  return (
    <LiquidityFormContext.Provider value={contextValue}>
      {children}
    </LiquidityFormContext.Provider>
  );
}

export function useLiquidityForm() {
  const context = useContext(LiquidityFormContext);
  if (!context) {
    throw new Error("useLiquidityForm must be used within LiquidityFormProvider");
  }
  return context;
}