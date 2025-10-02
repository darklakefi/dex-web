"use client";

import {
  ERROR_MESSAGES,
  isWarningMessage,
  useLiquidityTracking,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import type {
  CreateLiquidityTransactionInput,
  GetPoolReservesOutput,
} from "@dex-web/orpc/schemas";
import type { GetUserLiquidityOutput } from "@dex-web/orpc/schemas/pools/getUserLiquidity.schema";
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
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { dismissToast, toast } from "../../../_utils/toast";
import {
  FORM_FIELD_NAMES,
  LIQUIDITY_CONSTANTS,
} from "../_constants/liquidityConstants";
import { useLiquidityCalculationWorker } from "../_hooks/useLiquidityCalculationWorker";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type { LiquidityFormValues } from "../_types/liquidity.types";
import { liquidityFormSchema } from "../_types/liquidity.types";
import { startCacheCleanup } from "../_utils/calculationCache";
import {
  invalidateLiquidityQueries,
  verifyDataConsistency,
} from "../_utils/invalidateLiquidityCache";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

interface UseLiquidityFormLogicProps {
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}

export function useLiquidityFormLogic({
  tokenAAddress,
  tokenBAddress,
}: UseLiquidityFormLogicProps) {
  const { signTransaction, wallet } = useWallet();
  const { data: walletPublicKey } = useWalletPublicKey();
  const { data: walletAdapter } = useWalletAdapter();
  const { trackLiquidity, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const liquidityTranslations = useTranslations("liquidity");

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

  if (!cacheCleanupRef.current) {
    cacheCleanupRef.current = startCacheCleanup();
  }

  const sortedTokenAddresses = sortSolanaAddresses(
    tokenAAddress || "",
    tokenBAddress || "",
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
    hasRecentTransaction,
    publicKey: walletPublicKey || null,
    tokenAAddress: tokenAAddress,
    tokenBAddress: tokenBAddress,
  });

  useEffect(() => {
    send({
      buyAccount: tokenAccountsData.buyTokenAccount ?? null,
      sellAccount: tokenAccountsData.sellTokenAccount ?? null,
      type: "UPDATE_TOKEN_ACCOUNTS",
    });
  }, [
    send,
    tokenAccountsData.buyTokenAccount,
    tokenAccountsData.sellTokenAccount,
  ]);

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
        description: liquidityTranslations(
          "squadsX.responseStatus.failed.description",
        ),
        title: liquidityTranslations("squadsX.responseStatus.failed.title"),
      },
      squadsXSuccess: {
        description: liquidityTranslations(
          "squadsX.responseStatus.confirmed.description",
        ),
        title: liquidityTranslations("squadsX.responseStatus.confirmed.title"),
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
    onSuccess: async (result, _context) => {
      if (result.error) {
        const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
        const tokenBAmount = parseAmount(form.state.values.tokenBAmount);

        handleError(new Error(result.error), {
          amountA: form.state.values.tokenAAmount,
          amountB: form.state.values.tokenBAmount,
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        });

        trackFailed({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
          transactionHash: "",
        });
        return;
      }

      await queryClient.cancelQueries({
        queryKey: ["liquidity", tokenXMint, tokenYMint],
      });

      const userLiquidityOpts =
        tanstackClient.liquidity.getUserLiquidity.queryOptions({
          input: {
            ownerAddress: walletPublicKey?.toBase58() || "",
            tokenXMint,
            tokenYMint,
          },
        });

      const previousUserLiquidity = queryClient.getQueryData(
        userLiquidityOpts.queryKey,
      );
      const previousPoolReserves =
        queryClient.getQueryData<GetPoolReservesOutput>([
          "pool-reserves",
          tokenXMint,
          tokenYMint,
        ]);

      const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
      const tokenBAmount = parseAmount(form.state.values.tokenBAmount);

      const actualLpTokens = previousPoolReserves
        ? Math.min(
            (tokenAAmount / previousPoolReserves.reserveX) *
              previousPoolReserves.totalLpSupply,
            (tokenBAmount / previousPoolReserves.reserveY) *
              previousPoolReserves.totalLpSupply,
          )
        : 1;

      if (
        previousUserLiquidity &&
        typeof previousUserLiquidity === "object" &&
        "hasLiquidity" in previousUserLiquidity
      ) {
        const optimisticLiquidity = {
          ...previousUserLiquidity,
          hasLiquidity: true,
          lpTokenBalance:
            (previousUserLiquidity as GetUserLiquidityOutput).lpTokenBalance +
            actualLpTokens,
        };
        queryClient.setQueryData(
          userLiquidityOpts.queryKey,
          optimisticLiquidity,
        );
      }

      if (previousPoolReserves) {
        const optimisticPoolReserves = {
          ...previousPoolReserves,
          reserveX: previousPoolReserves.reserveX + tokenAAmount,
          reserveY: previousPoolReserves.reserveY + tokenBAmount,
          totalLpSupply: previousPoolReserves.totalLpSupply + actualLpTokens,
        };
        queryClient.setQueryData(
          ["pool-reserves", tokenXMint, tokenYMint],
          optimisticPoolReserves,
        );
      }

      send({ type: "SUCCESS" });

      trackConfirmed({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
        transactionHash: "",
      });

      form.reset();

      const successMessage = !isSquadsX(wallet)
        ? `ADDED LIQUIDITY: ${form.state.values.tokenAAmount} ${tokenBAddress} + ${form.state.values.tokenBAmount} ${tokenAAddress}`
        : undefined;

      transactionToasts.showSuccessToast(successMessage);
      tokenAccountsData.refetchBuyTokenAccount();
      tokenAccountsData.refetchSellTokenAccount();

      setTimeout(async () => {
        try {
          await invalidateLiquidityQueries({
            queryClient,
            tokenXMint,
            tokenYMint,
            walletPublicKey: walletPublicKey?.toBase58() || "",
          });

          await verifyDataConsistency(
            queryClient,
            tokenXMint,
            tokenYMint,
            walletPublicKey?.toBase58() || "",
          );
        } catch (error) {
          console.error("Cache invalidation failed:", error);
        }
      }, 3000);

      return { previousPoolReserves, previousUserLiquidity };
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

  const defaultValues: LiquidityFormValues = {
    [FORM_FIELD_NAMES.INITIAL_PRICE]: LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
    [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
    [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
  };

  const formConfig = {
    defaultValues,
    onSubmit: async ({ value }: { value: LiquidityFormValues }) => {
      send({ data: value, type: "SUBMIT" });
      await handleDeposit(value);
    },
    validators: {
      onChange: liquidityFormSchema,
      onDynamic: ({ value }: { value: LiquidityFormValues }) => {
        if (
          value.tokenAAmount &&
          walletPublicKey &&
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

            if (
              parseAmountBigNumber(tokenANumericValue).gt(maxBalance.toString())
            ) {
              const symbol = tokenAccount.symbol || "token";
              return { tokenAAmount: `Insufficient ${symbol} balance.` };
            }
          }
        }
      },
    },
  };

  const form = useAppForm(formConfig);

  const handleError = useCallback(
    (error: unknown, context?: Record<string, unknown>): void => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      send({ error: errorMessage, type: "ERROR" });

      const isWarning = isWarningMessage(error);
      if (isWarning) {
        transactionToasts.showInfoToast(errorMessage, context);
      } else {
        transactionToasts.showErrorToast(errorMessage, context);
      }

      if (context) {
        trackLiquidityError(error, context);
      }
    },
    [send, transactionToasts, trackLiquidityError],
  );

  const _resetFormToDefaults = useCallback((): void => {
    form.setFieldValue(FORM_FIELD_NAMES.TOKEN_A_AMOUNT, "0");
    form.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, "0");
    form.setFieldValue(FORM_FIELD_NAMES.INITIAL_PRICE, "1");
  }, [form]);

  const calculateTokenAmounts = useCallback(
    async ({
      inputAmount,
      editedToken,
    }: {
      inputAmount: string;
      editedToken: "tokenA" | "tokenB";
    }) => {
      const amountNumber = parseAmount(inputAmount);
      if (!poolDataResult.data || parseAmountBigNumber(inputAmount).lte(0))
        return;

      const reserveX = poolDataResult.data.reserveX;
      const reserveY = poolDataResult.data.reserveY;

      if (reserveX <= 0 || reserveY <= 0) return;

      const editedTokenAddress =
        editedToken === "tokenA" ? tokenAAddress : tokenBAddress;
      const isEditedTokenX =
        poolDataResult.data.tokenXMint === editedTokenAddress;

      let outputAmount: number;
      if (isEditedTokenX) {
        outputAmount = (amountNumber * reserveY) / reserveX;
      } else {
        outputAmount = (amountNumber * reserveX) / reserveY;
      }

      startTransition(() => {
        const targetField =
          editedToken === "tokenA" ? "tokenBAmount" : "tokenAAmount";
        form.setFieldValue(targetField, String(outputAmount));
        form.validateAllFields("change");
      });
    },
    [poolDataResult.data, form, tokenAAddress, tokenBAddress],
  );

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    LIQUIDITY_CONSTANTS.DEBOUNCE_DELAY_MS,
  );

  const clearPendingCalculations = useCallback(() => {
    if (
      "cancel" in debouncedCalculateTokenAmounts &&
      typeof debouncedCalculateTokenAmounts.cancel === "function"
    ) {
      debouncedCalculateTokenAmounts.cancel();
    }
  }, [debouncedCalculateTokenAmounts]);

  const _handleAmountChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      tokenType: "tokenA" | "tokenB",
    ) => {
      const value = formatAmountInput(e.target.value);

      clearPendingCalculations();

      if (
        e.isTrusted &&
        poolDataResult.data &&
        parseAmountBigNumber(value).gt(0)
      ) {
        debouncedCalculateTokenAmounts({
          editedToken: tokenType,
          inputAmount: value,
        });
      } else if (!poolDataResult.data) {
        if (tokenType === "tokenA") {
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
      if (!walletPublicKey) {
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
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
      });

      try {
        const trimmedTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
        const trimmedTokenBAddress =
          tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

        const sortedTokens = sortSolanaAddresses(
          trimmedTokenAAddress,
          trimmedTokenBAddress,
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

        const isTokenXSell = poolDataResult.data?.tokenXMint === tokenBAddress;
        const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
        const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

        const requestPayload = {
          maxAmountX: maxAmountX,
          maxAmountY: maxAmountY,
          slippage: Number(slippage || "0.5"),
          tokenXMint: tokenXAddress,
          tokenYMint: tokenYAddress,
          user: walletPublicKey.toBase58(),
        } satisfies CreateLiquidityTransactionInput;

        const response =
          await client.liquidity.createLiquidityTransaction(requestPayload);

        if (response.success && response.transaction) {
          trackSigned({
            action: "add",
            amountA: buyAmount,
            amountB: sellAmount,
            tokenA: tokenAAddress || "",
            tokenB: tokenBAddress || "",
          });

          requestLiquidityTransactionSigning({
            checkLiquidityTransactionStatus,
            publicKey: walletPublicKey,
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
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        });
      }
    },
    [
      walletPublicKey,
      transactionToasts,
      form.state.values,
      trackInitiated,
      tokenAAddress,
      tokenBAddress,
      walletAdapter?.wallet,
      poolDataResult.data?.tokenXMint,
      slippage,
      trackSigned,
      checkLiquidityTransactionStatus,
      signTransaction,
      handleError,
    ],
  );

  useEffect(() => {
    return () => {
      if (cacheCleanupRef.current) {
        cacheCleanupRef.current();
        cacheCleanupRef.current = null;
      }
    };
  }, []);

  const poolDetails = poolDataResult.data
    ? {
        fee: undefined,
        poolAddress: poolDataResult.data.lpMint,
        price: undefined,
        tokenXMint: poolDataResult.data.tokenXMint,
        tokenXReserve: poolDataResult.data.reserveX,
        tokenYMint: poolDataResult.data.tokenYMint,
        tokenYReserve: poolDataResult.data.reserveY,
        totalSupply: poolDataResult.data.totalLpSupply,
      }
    : null;

  return {
    debouncedCalculateTokenAmounts,
    form,
    handleDeposit,
    hasError: state.matches("error") && !!state.context.error,
    isCalculating: state.matches("calculating"),
    isError: state.matches("error"),
    isSubmitting: state.matches("submitting") || state.matches("signing"),
    isSuccess: state.matches("success"),
    poolDetails,
    publicKey: walletPublicKey || null,
    setSlippage,
    slippage,
    tokenAccountsData,
  };
}
