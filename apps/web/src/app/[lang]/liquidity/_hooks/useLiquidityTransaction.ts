"use client";

import { ERROR_MESSAGES, isWarningMessage } from "@dex-web/core";
import { client } from "@dex-web/orpc";
import { parseAmount, transformToAddLiquidityPayload } from "@dex-web/utils";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { useCallback, useRef } from "react";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import {
  useWalletAdapter,
  useWalletPublicKey,
} from "../../../../hooks/useWalletCache";
import { generateTrackingId } from "../../../_utils/generateTrackingId";
import { LIQUIDITY_CONSTANTS } from "../_constants/liquidityConstants";
import type {
  LiquidityFormValues,
  PoolDetails,
} from "../_types/liquidity.types";
import { calculateLpTokenAmount } from "../_utils/calculateLpTokens";
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

function validateTransactionInputs({
  effectivePublicKey,
  walletAdapter,
  wallet,
  currentPoolData,
}: {
  effectivePublicKey: PublicKey | null;
  walletAdapter: unknown;
  wallet: Wallet | null;
  currentPoolData: PoolDetails | null;
}) {
  if (
    !effectivePublicKey ||
    !walletAdapter?.wallet ||
    !wallet?.adapter?.publicKey
  ) {
    showErrorToast({ message: ERROR_MESSAGES.MISSING_WALLET_INFO });
    throw new Error(ERROR_MESSAGES.MISSING_WALLET_INFO);
  }
  if (!currentPoolData) {
    const errorMsg =
      "Pool not found for the selected token pair. Please create a pool first.";
    showErrorToast({ message: errorMsg });
    throw new Error(errorMsg);
  }
}

async function fetchTokenMetadata({
  trimmedTokenAAddress,
  trimmedTokenBAddress,
}: {
  trimmedTokenAAddress: string;
  trimmedTokenBAddress: string;
}) {
  const tokenMetadata = await client.tokens.getTokenMetadata({
    addresses: [trimmedTokenAAddress, trimmedTokenBAddress],
    returnAsObject: true,
  });

  if (
    !tokenMetadata ||
    typeof tokenMetadata !== "object" ||
    Array.isArray(tokenMetadata)
  ) {
    throw new Error("Invalid token metadata response");
  }

  const tokenAMeta = tokenMetadata[trimmedTokenAAddress];
  const tokenBMeta = tokenMetadata[trimmedTokenBAddress];

  if (!tokenAMeta || !tokenBMeta) {
    throw new Error("Failed to fetch token metadata for decimals");
  }

  return { tokenAMeta, tokenBMeta };
}

function buildRequestPayload({
  currentPoolData,
  trimmedTokenAAddress,
  trimmedTokenBAddress,
  tokenAMeta,
  tokenBMeta,
  values,
  effectivePublicKey,
}: {
  currentPoolData: PoolDetails;
  trimmedTokenAAddress: string;
  trimmedTokenBAddress: string;
  tokenAMeta: { decimals: number };
  tokenBMeta: { decimals: number };
  values: LiquidityFormValues;
  effectivePublicKey: PublicKey;
}) {
  return transformToAddLiquidityPayload({
    calculateLpTokens: (amountX: number, amountY: number) => {
      const amountLp = calculateLpTokenAmount(amountX, amountY, {
        reserveX: currentPoolData.tokenXReserve || 0,
        reserveY: currentPoolData.tokenYReserve || 0,
        totalLpSupply: currentPoolData.totalSupply || 0,
      });
      const multiplier = BigInt(10 ** LIQUIDITY_CONSTANTS.LP_TOKEN_DECIMALS);
      return amountLp * multiplier;
    },
    poolTokenXMint: currentPoolData.tokenXMint,
    slippage: values.slippage || "0.5",
    tokenAAddress: trimmedTokenAAddress,
    tokenAAmount: values.tokenAAmount,
    tokenBAddress: trimmedTokenBAddress,
    tokenBAmount: values.tokenBAmount,
    tokenXDecimals: tokenAMeta.decimals,
    tokenYDecimals: tokenBMeta.decimals,
    userAddress: effectivePublicKey.toBase58(),
  });
}

function handleTransactionError({
  error,
  values,
  tokenAAddress,
  tokenBAddress,
}: {
  error: unknown;
  values: LiquidityFormValues;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isWarning = isWarningMessage(error);
  if (isWarning) {
    showInfoToast({
      context: {
        amountA: values.tokenAAmount,
        amountB: values.tokenBAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      },
      message: errorMessage,
    });
  } else {
    showErrorToast({
      context: {
        amountA: values.tokenAAmount,
        amountB: values.tokenBAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      },
      message: errorMessage,
    });
  }
}

import { useLiquidityTransactionCore } from "./useLiquidityTransactionCore";
import { useLiquidityTransactionQueries } from "./useLiquidityTransactionQueries";

interface UseLiquidityTransactionParams {
  readonly tokenAAddress: string | null;
  readonly tokenBAddress: string | null;
  readonly poolDetails: PoolDetails | null;
  readonly form?: { reset: () => void } | null;
}

export function useLiquidityTransaction({
  tokenAAddress,
  tokenBAddress,
  poolDetails,
  form,
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

        const newTrackingId = generateTrackingId();

        const requestPayload = buildRequestPayload({
          currentPoolData,
          effectivePublicKey,
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
        handleTransactionError({
          error,
          tokenAAddress,
          tokenBAddress,
          values,
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
    form,
    submitTransaction,
  });

  return {
    ...transaction,
    publicKey: publicKey || wallet?.adapter?.publicKey || null,
  };
}
