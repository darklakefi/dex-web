"use client";

import {
  ERROR_MESSAGES,
  isWarningMessage,
  useLiquidityTracking,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import type { GetPoolReservesOutput } from "@dex-web/orpc/schemas";
import type { GetUserLiquidityOutput } from "@dex-web/orpc/schemas/pools/getUserLiquidity.schema";
import { parseAmount, sortSolanaAddresses } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMachine } from "@xstate/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { fromPromise } from "xstate";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import {
  useWalletAdapter,
  useWalletPublicKey,
} from "../../../../hooks/useWalletCache";
import { queryKeys } from "../../../../lib/queryKeys";
import { generateTrackingId } from "../../../_utils/generateTrackingId";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { dismissToast, toast } from "../../../_utils/toast";
import { liquidityMachine } from "../_machines/liquidityMachine";
import type {
  LiquidityFormValues,
  PoolDetails,
} from "../_types/liquidity.types";
import {
  calculateLpTokenAmount,
  convertToLamports,
} from "../_utils/calculateLpTokens";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";

interface UseLiquidityTransactionParams {
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
}

export function useLiquidityTransaction({
  tokenAAddress,
  tokenBAddress,
}: UseLiquidityTransactionParams) {
  const { signTransaction, wallet, publicKey } = useWallet();
  const { data: walletAdapter } = useWalletAdapter();
  const { data: walletPublicKey } = useWalletPublicKey();
  const { trackLiquidity, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const liquidityTranslations = useTranslations("liquidity");

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

  const [state, send] = useMachine(liquidityMachine, {
    actors: {
      submitLiquidity: fromPromise(
        async ({
          input,
        }: {
          input: {
            values: LiquidityFormValues;
            poolDetails: PoolDetails | null;
          };
        }) => {
          // Inline handleDeposit logic to avoid circular dependencies
          const { values, poolDetails } = input;

          console.log("🚀 Attempting liquidity deposit:", {
            poolDetails,
            tokenAAddress,
            tokenBAddress,
            values,
          });

          const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;

          if (
            !effectivePublicKey ||
            !walletAdapter?.wallet ||
            !wallet?.adapter?.publicKey
          ) {
            transactionToasts.showErrorToast(
              ERROR_MESSAGES.MISSING_WALLET_INFO,
            );
            return;
          }
          if (!poolDetails) {
            console.error("❌ Pool data missing:", {
              poolDetails,
              tokenAAddress,
              tokenBAddress,
            });
            transactionToasts.showErrorToast(
              "Pool not found for the selected token pair. Please create a pool first.",
            );
            return;
          }
          transactionToasts.showStepToast(1);

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
            const trimmedTokenAAddress = (tokenAAddress || "").trim();
            const trimmedTokenBAddress = (tokenBAddress || "").trim();
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
            const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
            const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
            const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

            const newTrackingId = generateTrackingId();

            const amountLp = calculateLpTokenAmount(maxAmountX, maxAmountY, {
              reserveX: poolDetails?.tokenXReserve || 0,
              reserveY: poolDetails?.tokenYReserve || 0,
              totalLpSupply: poolDetails?.totalSupply || 0,
            });

            const requestPayload = {
              amountLp: amountLp,
              label: "",
              maxAmountX: convertToLamports(maxAmountX),
              maxAmountY: convertToLamports(maxAmountY),
              refCode: "",
              tokenMintX: tokenXAddress,
              tokenMintY: tokenYAddress,
              userAddress: effectivePublicKey.toBase58(),
            };

            const response =
              await client.dexGateway.addLiquidity(requestPayload);

            if (response.unsignedTransaction) {
              trackSigned({
                action: "add",
                amountA: buyAmount,
                amountB: sellAmount,
                tokenA: tokenAAddress || "",
                tokenB: tokenBAddress || "",
              });
              requestLiquidityTransactionSigning({
                checkLiquidityTransactionStatus: async (
                  tradeId: string,
                  currentTrackingId: string,
                ) => {
                  await statusChecker.checkTransactionStatus(
                    currentTrackingId,
                    tradeId,
                  );
                },
                publicKey: effectivePublicKey,
                setLiquidityStep: () => {},
                signTransaction,
                trackingId: newTrackingId,
                unsignedTransaction: response.unsignedTransaction,
              });
            } else {
              throw new Error("Failed to create liquidity transaction");
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            send({ error: errorMessage, type: "ERROR" });
            const isWarning = isWarningMessage(error);
            if (isWarning) {
              transactionToasts.showInfoToast(errorMessage, {
                amountA: values.tokenAAmount,
                amountB: values.tokenBAmount,
                tokenA: tokenAAddress,
                tokenB: tokenBAddress,
              });
            } else {
              transactionToasts.showErrorToast(errorMessage, {
                amountA: values.tokenAAmount,
                amountB: values.tokenBAmount,
                tokenA: tokenAAddress,
                tokenB: tokenBAddress,
              });
            }
            trackLiquidityError(error, {
              amountA: values.tokenAAmount,
              amountB: values.tokenBAmount,
              tokenA: tokenAAddress,
              tokenB: tokenBAddress,
            });
          }
        },
      ),
    },
  });

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

  const statusChecker = useTransactionStatus({
    checkStatus: async (currentTrackingId: string, tradeId?: string) => {
      if (!tradeId) {
        throw new Error("Trade ID is required");
      }
      const response = await client.dexGateway.checkTradeStatus({
        trackingId: currentTrackingId,
        tradeId,
      });
      return {
        data: response,
        error: undefined,
        status: response.status === 0 ? "finalized" : "pending",
      } as const;
    },
    failStates: ["failed"],
    maxAttempts: 10,
    onFailure: (result) => {
      handleError(new Error(result.error || "Unknown error"));
    },
    onStatusUpdate: (status, attempt) => {
      transactionToasts.showStatusToast(
        `Finalizing transaction... (${attempt}/10) - ${status}`,
      );
    },
    onSuccess: async (result) => {
      if (result.error) {
        const v = lastSubmittedValuesRef.current;
        handleError(new Error(result.error), {
          amountA: v?.tokenAAmount,
          amountB: v?.tokenBAmount,
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        });
        trackFailed({
          action: "add",
          amountA: v ? parseAmount(v.tokenAAmount) : 0,
          amountB: v ? parseAmount(v.tokenBAmount) : 0,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
          transactionHash: "",
        });
        return;
      }

      const currentPoolData = currentPoolDetails;
      const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;
      if (!currentPoolData || !effectivePublicKey || !walletPublicKey) return;

      await queryClient.cancelQueries({
        queryKey: [
          "liquidity",
          currentPoolData.tokenXMint,
          currentPoolData.tokenYMint,
        ],
      });

      const userLiquidityQueryKey = queryKeys.liquidity.user(
        walletPublicKey.toBase58(),
        currentPoolData.tokenXMint,
        currentPoolData.tokenYMint,
      );
      const poolReservesQueryKey = queryKeys.pools.reserves(
        currentPoolData.tokenXMint,
        currentPoolData.tokenYMint,
      );

      const previousUserLiquidity = queryClient.getQueryData(
        userLiquidityQueryKey,
      );
      const previousPoolReserves =
        queryClient.getQueryData<GetPoolReservesOutput>(poolReservesQueryKey);

      const tokenAAmount = parseAmount(
        lastSubmittedValuesRef.current?.tokenAAmount || "0",
      );
      const tokenBAmount = parseAmount(
        lastSubmittedValuesRef.current?.tokenBAmount || "0",
      );

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
        queryClient.setQueryData(userLiquidityQueryKey, optimisticLiquidity);
      } else if (!previousUserLiquidity) {
        const optimisticLiquidity: GetUserLiquidityOutput = {
          decimals: 6,
          hasLiquidity: true,
          lpTokenBalance: actualLpTokens,
          lpTokenMint: currentPoolData.tokenXMint,
        };
        queryClient.setQueryData(userLiquidityQueryKey, optimisticLiquidity);
      }
      if (previousPoolReserves) {
        const optimisticPoolReserves = {
          ...previousPoolReserves,
          reserveX: previousPoolReserves.reserveX + tokenAAmount,
          reserveY: previousPoolReserves.reserveY + tokenBAmount,
          totalLpSupply: previousPoolReserves.totalLpSupply + actualLpTokens,
        };
        queryClient.setQueryData(poolReservesQueryKey, optimisticPoolReserves);
      }

      send({ type: "SUCCESS" });
      // Tracking confirmation
      trackConfirmed({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
        transactionHash: "",
      });
    },
    onTimeout: () => {
      handleError(
        new Error(
          "Transaction may still be processing. Check explorer for status.",
        ),
      );
    },
    retryDelay: 3_000,
    successStates: ["finalized"],
  });

  const lastSubmittedValuesRef = useRef<LiquidityFormValues | null>(null);

  const isSubmitting = state.matches("submitting");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");
  const isCalculating = state.matches({ ready: "calculating" });
  const isLoadingInitialData = state.matches("loadingInitialData");
  const isReady = state.matches("ready");

  const publicKeyMemo = useMemo(
    () => publicKey || wallet?.adapter?.publicKey || null,
    [publicKey, wallet?.adapter?.publicKey],
  );

  return {
    isCalculating,
    isError,
    isLoadingInitialData,
    isReady,
    isSubmitting,
    isSuccess,
    publicKey: publicKeyMemo,
    send,
    state,
  } as const;
}
