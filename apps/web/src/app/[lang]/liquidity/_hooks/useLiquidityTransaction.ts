"use client";

import { ERROR_MESSAGES } from "@dex-web/core";
import { client } from "@dex-web/orpc";
import type { TokenOrderContext } from "@dex-web/utils";
import { parseAmount } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useRef } from "react";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import {
  useWalletAdapter,
  useWalletPublicKey,
} from "../../../../hooks/useWalletCache";
import { generateTrackingId } from "../../../_utils/generateTrackingId";
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
import {
  showErrorToast,
  showInfoToast,
  showStepToast,
} from "../_utils/liquidityTransactionToasts";
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

  const { addLiquidityMutation, invalidateQueries } =
    useLiquidityTransactionQueries();

  const lastSubmittedValuesRef = useRef<LiquidityFormValues | null>(null);

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
        showErrorToast({ message: errorMessage });
        throw validationError;
      }

      if (!effectivePublicKey) {
        throw new Error(ERROR_MESSAGES.MISSING_WALLET_INFO);
      }

      if (!currentPoolData) {
        throw new Error("Pool data is required");
      }

      showStepToast(1);

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

        const poolDataForCalculation: PoolDetails = {
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

        const requestPayload = buildRequestPayload({
          currentPoolData: poolDataForCalculation,
          effectivePublicKey,
          orderContext,
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
            tokenXMint: requestPayload.tokenMintX,
            tokenYMint: requestPayload.tokenMintY,
            trackingId: newTrackingId,
            unsignedTransaction: response.unsignedTransaction,
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
          showInfoToast({
            context: errorInfo.context,
            message: errorInfo.message,
          });
        } else {
          showErrorToast({
            context: errorInfo.context,
            message: errorInfo.message,
          });
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
    ],
  );

  const transaction = useLiquidityTransactionCore({
    resetForm,
    submitTransaction,
  });

  const handleFormSubmit = useCallback(
    ({ value }: { value: LiquidityFormValues }) => {
      if (transaction.isError) {
        transaction.send({ type: "RETRY" });
      } else {
        transaction.send({ data: value, type: "SUBMIT" });
      }
    },
    [transaction.isError, transaction.send],
  );

  return {
    ...transaction,
    handleFormSubmit,
    publicKey: publicKey || wallet?.adapter?.publicKey || null,
  };
}
