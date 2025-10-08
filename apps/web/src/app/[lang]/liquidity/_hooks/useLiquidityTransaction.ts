"use client";

import {
  ERROR_MESSAGES,
  isWarningMessage,
  useLiquidityTracking,
  useTransactionToasts,
} from "@dex-web/core";
import { parseAmount, sortSolanaAddresses } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMachine } from "@xstate/react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { fromPromise } from "xstate";
import { useAddLiquidityMutation } from "../../../../hooks/mutations/useAddLiquidityMutation";
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
  readonly poolDetails: PoolDetails | null;
}

export function useLiquidityTransaction({
  tokenAAddress,
  tokenBAddress,
  poolDetails,
}: UseLiquidityTransactionParams) {
  const { signTransaction, wallet, publicKey } = useWallet();
  const { data: walletAdapter } = useWalletAdapter();
  const { data: walletPublicKey } = useWalletPublicKey();
  const { trackLiquidity, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const liquidityTranslations = useTranslations("liquidity");

  // Use TanStack Query mutation for optimistic updates
  const addLiquidityMutation = useAddLiquidityMutation();

  // Store submitted values for tracking
  const lastSubmittedValuesRef = useRef<LiquidityFormValues | null>(null);

  const {
    trackInitiated,
    trackSigned,
    trackConfirmed,
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

  const [state, send] = useMachine(
    liquidityMachine.provide({
      actors: {
        submitLiquidity: fromPromise(
          async ({
            input,
          }: {
            input: {
              values: LiquidityFormValues;
            };
          }) => {
            // Query owns poolDetails - read it fresh from the hook parameter
            const currentPoolData = poolDetails;
            const { values } = input;

            // Store values for tracking
            lastSubmittedValuesRef.current = values;

            const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;

            if (
              !effectivePublicKey ||
              !walletAdapter?.wallet ||
              !wallet?.adapter?.publicKey
            ) {
              transactionToasts.showErrorToast(
                ERROR_MESSAGES.MISSING_WALLET_INFO,
              );
              throw new Error(ERROR_MESSAGES.MISSING_WALLET_INFO);
            }
            if (!currentPoolData) {
              const errorMsg =
                "Pool not found for the selected token pair. Please create a pool first.";
              transactionToasts.showErrorToast(errorMsg);
              throw new Error(errorMsg);
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
              const isTokenXSell =
                currentPoolData?.tokenXMint === tokenBAddress;
              const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
              const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

              const newTrackingId = generateTrackingId();

              const amountLp = calculateLpTokenAmount(maxAmountX, maxAmountY, {
                reserveX: currentPoolData?.tokenXReserve || 0,
                reserveY: currentPoolData?.tokenYReserve || 0,
                totalLpSupply: currentPoolData?.totalSupply || 0,
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

              // Use mutation for optimistic updates
              const response =
                await addLiquidityMutation.mutateAsync(requestPayload);

              if (response.unsignedTransaction) {
                trackSigned({
                  action: "add",
                  amountA: buyAmount,
                  amountB: sellAmount,
                  tokenA: tokenAAddress || "",
                  tokenB: tokenBAddress || "",
                });
                await requestLiquidityTransactionSigning({
                  onSuccess: async () => {
                    // Invalidate queries to ensure fresh data from server
                    if (poolDetails && walletPublicKey) {
                      await queryClient.invalidateQueries({
                        queryKey: queryKeys.liquidity.user(
                          walletPublicKey.toBase58(),
                          poolDetails.tokenXMint,
                          poolDetails.tokenYMint,
                        ),
                      });
                      await queryClient.invalidateQueries({
                        queryKey: queryKeys.pools.reserves(
                          poolDetails.tokenXMint,
                          poolDetails.tokenYMint,
                        ),
                      });
                      await queryClient.invalidateQueries({
                        queryKey: queryKeys.tokens.accounts(
                          walletPublicKey.toBase58(),
                        ),
                      });
                    }

                    // Track confirmation
                    trackConfirmed({
                      action: "add",
                      amountA: buyAmount,
                      amountB: sellAmount,
                      tokenA: tokenAAddress || "",
                      tokenB: tokenBAddress || "",
                      transactionHash: newTrackingId,
                    });
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
              // Re-throw to trigger machine error state
              throw error;
            }
          },
        ),
      },
    }),
  );

  const _handleError = useCallback(
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

  const isSubmitting = state.matches("submitting");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");
  const isCalculating = state.matches({ ready: "calculating" });
  const isReady = state.matches("ready");

  const publicKeyMemo = useMemo(
    () => publicKey || wallet?.adapter?.publicKey || null,
    [publicKey, wallet?.adapter?.publicKey],
  );

  return {
    isCalculating,
    isError,
    isReady,
    isSubmitting,
    isSuccess,
    publicKey: publicKeyMemo,
    send,
    state,
  } as const;
}
