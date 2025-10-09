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

        console.log("🔄 Fetching fresh pool reserves before transaction...");
        const freshPoolData = await client.pools.getPoolReserves({
          tokenXMint: currentPoolData.tokenXMint,
          tokenYMint: currentPoolData.tokenYMint,
        });

        if (!freshPoolData || !freshPoolData.exists) {
          throw new Error("Failed to fetch fresh pool reserves");
        }

        console.log("📊 ===== POOL RESERVES COMPARISON =====");
        console.log("Frontend cached pool data:", {
          protocolFeeX: currentPoolData.protocolFeeX?.toString(),
          protocolFeeY: currentPoolData.protocolFeeY?.toString(),
          tokenXReserveRaw: currentPoolData.tokenXReserveRaw?.toString(),
          tokenYReserveRaw: currentPoolData.tokenYReserveRaw?.toString(),
          totalSupplyRaw: currentPoolData.totalSupplyRaw?.toString(),
          userLockedX: currentPoolData.userLockedX?.toString(),
          userLockedY: currentPoolData.userLockedY?.toString(),
        });
        console.log("Fresh on-chain pool data:", {
          protocolFeeXRaw: freshPoolData.protocolFeeXRaw?.toString(),
          protocolFeeYRaw: freshPoolData.protocolFeeYRaw?.toString(),
          reserveXRaw: freshPoolData.reserveXRaw?.toString(),
          reserveYRaw: freshPoolData.reserveYRaw?.toString(),
          totalLpSupplyRaw: freshPoolData.totalLpSupplyRaw?.toString(),
          userLockedXRaw: freshPoolData.userLockedXRaw?.toString(),
          userLockedYRaw: freshPoolData.userLockedYRaw?.toString(),
        });
        console.log(
          "Available reserves (reserve - protocol_fee - user_locked):",
        );
        const reserveX = BigInt(freshPoolData.reserveXRaw || 0);
        const reserveY = BigInt(freshPoolData.reserveYRaw || 0);
        const protocolFeeX = BigInt(freshPoolData.protocolFeeXRaw || 0);
        const protocolFeeY = BigInt(freshPoolData.protocolFeeYRaw || 0);
        const userLockedX = BigInt(freshPoolData.userLockedXRaw || 0);
        const userLockedY = BigInt(freshPoolData.userLockedYRaw || 0);

        const availableX = reserveX - protocolFeeX - userLockedX;
        const availableY = reserveY - protocolFeeY - userLockedY;
        console.log({
          availableReserveX: availableX.toString(),
          availableReserveY: availableY.toString(),
        });
        console.log("📊 ===== END COMPARISON =====\n");

        const poolDataForCalculation: PoolDetails = {
          ...currentPoolData,
          // Use fresh data if available, otherwise fallback to cached
          protocolFeeX:
            freshPoolData.protocolFeeXRaw ?? currentPoolData.protocolFeeX,
          protocolFeeY:
            freshPoolData.protocolFeeYRaw ?? currentPoolData.protocolFeeY,
          tokenXMint: currentPoolData.tokenXMint,
          tokenXReserveRaw: freshPoolData.reserveXRaw,
          tokenYMint: currentPoolData.tokenYMint,
          tokenYReserveRaw: freshPoolData.reserveYRaw,
          totalSupplyRaw: freshPoolData.totalLpSupplyRaw,
          userLockedX:
            freshPoolData.userLockedXRaw ?? currentPoolData.userLockedX,
          userLockedY:
            freshPoolData.userLockedYRaw ?? currentPoolData.userLockedY,
        };

        console.log("⚠️ Using these values for calculation:", {
          protocolFeeX: poolDataForCalculation.protocolFeeX?.toString(),
          protocolFeeY: poolDataForCalculation.protocolFeeY?.toString(),
          userLockedX: poolDataForCalculation.userLockedX?.toString(),
          userLockedY: poolDataForCalculation.userLockedY?.toString(),
        });

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

        console.log("📤 ===== REQUEST PAYLOAD TO SOLANA PROGRAM =====");
        console.log("🎯 Transaction Parameters:", {
          amountLp: requestPayload.amountLp.toString(),
          maxAmountX: requestPayload.maxAmountX.toString(),
          maxAmountY: requestPayload.maxAmountY.toString(),
          tokenMintX: requestPayload.tokenMintX,
          tokenMintY: requestPayload.tokenMintY,
          userAddress: requestPayload.userAddress,
        });
        console.log(
          "⚠️ CRITICAL: Solana program will ADD transfer fees to these amounts!",
        );
        console.log(
          "⚠️ If transfer fees exist, the program will need MORE than maxAmount!",
        );
        console.log("📤 ===== END REQUEST PAYLOAD =====\n");

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
      console.log("🔥 handleFormSubmit called with value:", value);
      if (transaction.isError) {
        console.log("🔄 Retrying transaction...");
        transaction.send({ type: "RETRY" });
      } else {
        console.log("📤 Sending SUBMIT event to XState machine");
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
