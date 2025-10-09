"use client";

import { ERROR_MESSAGES } from "@dex-web/core";
import { client } from "@dex-web/orpc";
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
import { showStepToast } from "../_utils/liquidityTransactionToasts";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import {
  buildRequestPayload,
  fetchTokenMetadata,
  handleTransactionError,
  validateTransactionInputs,
} from "../_utils/transactionHelpers";

import { useLiquidityTransactionCore } from "./useLiquidityTransactionCore";
import { useLiquidityTransactionQueries } from "./useLiquidityTransactionQueries";

interface UseLiquidityTransactionParams {
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
  readonly poolDetails: PoolDetails | null;
  readonly resetForm?: () => void;
}

export function useLiquidityTransaction({
  tokenAAddress,
  tokenBAddress,
  poolDetails,
  resetForm,
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

      validateTransactionInputs({
        currentPoolData,
        effectivePublicKey,
        wallet,
        walletAdapter,
      });

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

        console.log("🔄 Fetching fresh pool reserves before transaction...");
        const freshPoolData = await client.pools.getPoolReserves({
          tokenXMint: currentPoolData!.tokenXMint,
          tokenYMint: currentPoolData!.tokenYMint,
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

        console.log("✅ Using fresh pool reserves:", {
          lpMint: freshPoolData.lpMint,
          note: "These are AVAILABLE reserves (matches add_liquidity.rs), fetched just-in-time",
          rustSource: "reserve.amount - protocol_fee - user_locked",
          tokenXReserveRaw: freshPoolData.reserveXRaw,
          tokenYReserveRaw: freshPoolData.reserveYRaw,
          totalLpSupplyRaw: freshPoolData.totalLpSupplyRaw,
          warning: "⚠️ If values don't match backend, there's a timing issue!",
        });

        const newTrackingId = generateTrackingId();

        const requestPayload = buildRequestPayload({
          currentPoolData: poolDataForCalculation,
          effectivePublicKey: effectivePublicKey!,
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
            publicKey: effectivePublicKey!,
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
        handleTransactionError({
          error,
          tokenAAddress,
          tokenAAmount: values.tokenAAmount,
          tokenBAddress,
          tokenBAmount: values.tokenBAmount,
        });
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
    ],
  );

  const transaction = useLiquidityTransactionCore({
    resetForm,
    submitTransaction,
  });

  return {
    ...transaction,
    publicKey: publicKey || wallet?.adapter?.publicKey || null,
  };
}
