"use client";

import { ERROR_MESSAGES, useTransactionToasts } from "@dex-web/core";
import { client } from "@dex-web/orpc";
import type { TokenOrderContext } from "@dex-web/utils";
import { parseAmount } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import {
  useWalletAdapter,
  useWalletPublicKey,
} from "../../../../hooks/useWalletCache";
import { useReferralCode } from "../../../_components/ReferralCodeProvider";
import { generateTrackingId } from "../../../_utils/generateTrackingId";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { dismissToast, toast } from "../../../_utils/toast";
import type {
  LiquidityFormValues,
  PoolDetails,
} from "../_types/liquidity.types";
import {
  trackConfirmed,
  trackInitiated,
  trackLiquidityError,
  trackSigned,
} from "../_utils/liquidityTransactionAnalytics";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import {
  buildRequestPayload,
  classifyTransactionError,
  fetchTokenMetadata,
  validateTransactionInputs,
} from "../_utils/transactionHelpers";
import { useLiquidityTransactionCore } from "./useLiquidityTransactionCore";
import { useLiquidityTransactionQueries } from "./useLiquidityTransactionQueries";

interface UseLiquidityTransactionParams {
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
  readonly poolDetails: PoolDetails | null;
  readonly resetForm?: () => void;
  readonly orderContext: TokenOrderContext | null;
}

export function useLiquidityTransaction({
  tokenAAddress,
  tokenBAddress,
  poolDetails,
  resetForm,
  orderContext,
}: UseLiquidityTransactionParams) {
  const { signTransaction, wallet, publicKey } = useWallet();
  const { data: walletAdapter } = useWalletAdapter();
  const { data: walletPublicKey } = useWalletPublicKey();
  const { trackLiquidity, trackError } = useAnalytics();
  const { incomingReferralCode } = useReferralCode();
  const t = useTranslations("liquidity");

  const { addLiquidityMutation, invalidateQueries } =
    useLiquidityTransactionQueries();

  const lastSubmittedValuesRef = useRef<LiquidityFormValues | null>(null);

  const toasts = useTransactionToasts({
    customMessages: {
      squadsXFailure: {
        description: t("squadsX.responseStatus.failed.description"),
        title: t("squadsX.responseStatus.failed.title"),
      },
      squadsXSuccess: {
        description: t("squadsX.responseStatus.confirmed.description"),
        title: t("squadsX.responseStatus.confirmed.title"),
      },
    },
    dismissToast,
    isSquadsX: isSquadsX(walletAdapter?.wallet),
    toast,
    transactionType: "LIQUIDITY",
  });

  const submitTransaction = useCallback(
    async ({ values }: { values: LiquidityFormValues }) => {
      const currentPoolData = poolDetails;
      lastSubmittedValuesRef.current = values;

      const effectivePublicKey = publicKey || wallet?.adapter?.publicKey;

      try {
        validateTransactionInputs({
          currentPoolData,
          effectivePublicKey,
          wallet,
          walletAdapter,
        });
      } catch (validationError) {
        const errorMessage =
          validationError instanceof Error
            ? validationError.message
            : String(validationError);
        toasts.showErrorToast(errorMessage);
        throw validationError;
      }

      if (!effectivePublicKey) {
        throw new Error(ERROR_MESSAGES.MISSING_WALLET_INFO);
      }

      if (!currentPoolData) {
        throw new Error("Pool data is required");
      }

      toasts.showStepToast(1);

      const tokenAAmount = parseAmount(values.tokenAAmount);
      const tokenBAmount = parseAmount(values.tokenBAmount);
      trackInitiated(trackLiquidity, {
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
      });
      try {
        const trimmedTokenAAddress = (tokenAAddress || "").trim();
        const trimmedTokenBAddress = (tokenBAddress || "").trim();

        if (!walletAdapter?.wallet) {
          throw new Error(ERROR_MESSAGES.MISSING_WALLET);
        }

        const { tokenAMeta, tokenBMeta } = await fetchTokenMetadata({
          trimmedTokenAAddress,
          trimmedTokenBAddress,
        });

        const freshPoolData = await client.pools.getPoolReserves({
          tokenXMint: currentPoolData.tokenXMint,
          tokenYMint: currentPoolData.tokenYMint,
        });

        if (!freshPoolData || !freshPoolData.exists) {
          throw new Error("Failed to fetch fresh pool reserves");
        }

        const updatedPoolData: PoolDetails = {
          ...currentPoolData,
          tokenXMint: currentPoolData.tokenXMint,
          tokenXReserveRaw: freshPoolData.reserveXRaw,
          tokenYMint: currentPoolData.tokenYMint,
          tokenYReserveRaw: freshPoolData.reserveYRaw,
          totalSupplyRaw: freshPoolData.totalLpSupplyRaw,
        };

        const newTrackingId = generateTrackingId();

        if (!orderContext) {
          throw new Error("Token order context is required for transaction");
        }

        const requestPayload = await buildRequestPayload({
          currentPoolData: updatedPoolData,
          effectivePublicKey,
          orderContext,
          refCode: incomingReferralCode || "",
          tokenAMeta,
          tokenBMeta,
          trimmedTokenAAddress,
          trimmedTokenBAddress,
          values,
        });

        const response = await addLiquidityMutation.mutateAsync(requestPayload);

        if (response.unsignedTransaction) {
          trackSigned(trackLiquidity, {
            action: "add",
            amountA: tokenAAmount,
            amountB: tokenBAmount,
            tokenA: tokenAAddress || "",
            tokenB: tokenBAddress || "",
          });
          await requestLiquidityTransactionSigning({
            onSuccess: async () => {
              toasts.showSuccessToast();

              if (poolDetails && walletPublicKey) {
                await invalidateQueries(walletPublicKey, poolDetails);
              }

              trackConfirmed(trackLiquidity, {
                amountA: tokenAAmount,
                amountB: tokenBAmount,
                tokenA: tokenAAddress || "",
                tokenB: tokenBAddress || "",
                transactionHash: newTrackingId,
              });
            },
            publicKey: effectivePublicKey,
            setLiquidityStep: () => {},
            signTransaction,
            toasts,
            tokenXMint: requestPayload.tokenMintX,
            tokenYMint: requestPayload.tokenMintY,
            trackingId: newTrackingId,
            unsignedTransaction: response.unsignedTransaction,
            wallet: walletAdapter?.wallet,
          });
        } else {
          throw new Error("Failed to create liquidity transaction");
        }
      } catch (error) {
        console.error("Submit transaction failed:", error);

        const errorInfo = classifyTransactionError({
          error,
          tokenAAddress,
          tokenAAmount: values.tokenAAmount,
          tokenBAddress,
          tokenBAmount: values.tokenBAmount,
        });

        if (errorInfo.isWarning) {
          toasts.showWarningToast(errorInfo.message, errorInfo.context);
        } else {
          toasts.showErrorToast(errorInfo.message, errorInfo.context);
        }

        trackLiquidityError(trackError, error, {
          amountA: values.tokenAAmount,
          amountB: values.tokenBAmount,
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        });

        throw error;
      }
    },
    [
      poolDetails,
      publicKey,
      wallet,
      walletAdapter,
      tokenAAddress,
      tokenBAddress,
      trackLiquidity,
      addLiquidityMutation,
      walletPublicKey,
      invalidateQueries,
      trackError,
      signTransaction,
      orderContext,
      toasts,
      incomingReferralCode,
    ],
  );

  const transaction = useLiquidityTransactionCore({
    resetForm,
    submitTransaction,
  });

  const handleFormSubmit = useCallback(
    ({ value }: { value: LiquidityFormValues }) => {
      transaction.send({ data: value, type: "SUBMIT" });
    },
    [transaction.send],
  );

  return {
    ...transaction,
    handleFormSubmit,
    publicKey: publicKey || wallet?.adapter?.publicKey || null,
  };
}
