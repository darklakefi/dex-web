"use client";

import {
  ERROR_MESSAGES,
  useLiquidityTracking,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { Box, Icon } from "@dex-web/ui";
import {
  parseAmount,
  sortSolanaAddresses,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletPublicKey, useWalletAdapter } from "../../../../hooks/useWalletCache";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { useState, useCallback } from "react";
import type { WalletAdapter } from "../_types/enhanced.types";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { useRealtimePoolData } from "../../../../hooks/useRealtimePoolData";
import { useRealtimeTokenAccounts } from "../../../../hooks/useRealtimeTokenAccounts";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
  EMPTY_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { dismissToast, toast } from "../../../_utils/toast";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import { AddLiquidityDetails } from "./AddLiquidityDetail";
import { LiquidityFormProvider, useLiquidityForm } from "./LiquidityFormProvider";
import { LiquidityTokenInputs } from "./LiquidityTokenInputs";
import { LiquidityActionButton } from "./LiquidityActionButton";
import { LiquidityTransactionStatus } from "./LiquidityTransactionStatus";
import { withErrorBoundary, toLiquidityError, } from "../_utils/liquidityErrors";

const serialize = createSerializer(liquidityPageParsers);

function LiquidityFormContent() {
  const router = useRouter();
  const { signTransaction } = useWallet();
  const { data: publicKey } = useWalletPublicKey();
  const { data: walletAdapter } = useWalletAdapter() as { data: WalletAdapter | null };
  const { trackLiquidity, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(selectedTokensParsers);
  const { state, send, form } = useLiquidityForm();

  const tx = useTranslations("liquidity");

  const sortedTokenAddresses = sortSolanaAddresses(tokenAAddress, tokenBAddress);
  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const { poolDetails, isLoading: isPoolLoading } = useRealtimePoolData({
    tokenXMint,
    tokenYMint,
  });

  const {
    buyTokenAccount,
    sellTokenAccount,
    refetchBuyTokenAccount,
    refetchSellTokenAccount,
    isLoadingBuy,
    isLoadingSell,
    isRefreshingBuy,
    isRefreshingSell,
    isRealtime: _isTokenAccountsRealtime,
  } = useRealtimeTokenAccounts({
    publicKey,
    tokenAAddress,
    tokenBAddress,
  });

  const [slippage, setSlippage] = useState("0.5");

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

  const toasts = useTransactionToasts({
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

  const handleError = useCallback((error: unknown, context?: Record<string, unknown>): void => {
    const liquidityError = toLiquidityError(error, context);
    send({ type: "ERROR", error: liquidityError.message });
    toasts.showErrorToast(liquidityError.message);

    if (context) {
      trackLiquidityError(error, context);
    }
  }, [send, toasts, trackLiquidityError]);

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
    maxAttempts: 15,
    onFailure: (result) => {
      handleError(new Error(result.error || "Unknown error"));
    },
    onStatusUpdate: (status, attempt) => {
      toasts.showStatusToast(
        `Finalizing transaction... (${attempt}/15) - ${status}`,
      );
    },
    onSuccess: (result) => {
      if (result.error) {
        const tokenAAmount = parseAmount(state.formValues.tokenAAmount);
        const tokenBAmount = parseAmount(state.formValues.tokenBAmount);

        handleError(new Error(result.error), {
          amountA: state.formValues.tokenAAmount,
          amountB: state.formValues.tokenBAmount,
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

      send({ type: "SUCCESS" });
      const tokenAAmount = parseAmount(state.formValues.tokenAAmount);
      const tokenBAmount = parseAmount(state.formValues.tokenBAmount);

      trackConfirmed({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
        transactionHash: "",
      });

      const successMessage = !isSquadsX(walletAdapter?.wallet)
        ? `ADDED LIQUIDITY: ${state.formValues.tokenAAmount} ${tokenBAddress} + ${state.formValues.tokenBAmount} ${tokenAAddress}`
        : undefined;

      toasts.showSuccessToast(successMessage);
      refetchBuyTokenAccount();
      refetchSellTokenAccount();
      queryClient.invalidateQueries({
        queryKey: ["token-accounts", publicKey?.toBase58()],
      });
    },
    onTimeout: () => {
      handleError(
        new Error("Transaction may still be processing. Check explorer for status."),
      );
    },
    retryDelay: 2000,
    successStates: ["finalized"],
  });

  const checkLiquidityTransactionStatus = useCallback(async (signature: string) => {
    await statusChecker.checkTransactionStatus(signature);
  }, [statusChecker]);

  const handleDeposit = useCallback(async () => {
    if (!publicKey) {
      toasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
      return;
    }

    await withErrorBoundary(
      async () => {
        toasts.showStepToast(1);

        const tokenAAmount = parseAmount(state.formValues.tokenAAmount);
        const tokenBAmount = parseAmount(state.formValues.tokenBAmount);
        trackInitiated({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
        });

        const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
        const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

        const sortedTokens = sortSolanaAddresses(finalTokenAAddress, finalTokenBAddress);
        const { tokenXAddress, tokenYAddress } = sortedTokens;

        if (!walletAdapter?.wallet) {
          throw new Error(ERROR_MESSAGES.MISSING_WALLET);
        }

        if (!tokenXAddress || !tokenYAddress) {
          throw new Error("Invalid token addresses after sorting");
        }

        const sellAmount = parseAmount(state.formValues.tokenBAmount);
        const buyAmount = parseAmount(state.formValues.tokenAAmount);

        const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
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

        const response = await client.liquidity.createLiquidityTransaction(requestPayload);

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
            publicKey,
            setLiquidityStep: () => {},
            signTransaction,
            unsignedTransaction: response.transaction,
          });
        } else {
          throw new Error("Failed to create liquidity transaction");
        }
      },
      handleError,
      {
        amountA: state.formValues.tokenAAmount,
        amountB: state.formValues.tokenBAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      }
    );
  }, [
    publicKey,
    state.formValues,
    tokenAAddress,
    tokenBAddress,
    poolDetails,
    slippage,
    walletAdapter,
    trackInitiated,
    trackSigned,
    toasts,
    handleError,
    checkLiquidityTransactionStatus,
    signTransaction,
  ]);

  const handleRetry = useCallback(async () => {
    send({ type: "RETRY" });
    await handleDeposit();
  }, [send, handleDeposit]);

  const handleReset = useCallback(() => {
    send({ type: "RESET" });
  }, [send]);

  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />

      <Box padding="lg">
        <div className="flex flex-col gap-4">
          <LiquidityTokenInputs
            form={form}
            buyTokenAccount={buyTokenAccount}
            sellTokenAccount={sellTokenAccount}
            isLoadingBuy={isLoadingBuy}
            isLoadingSell={isLoadingSell}
            isRefreshingBuy={isRefreshingBuy}
            isRefreshingSell={isRefreshingSell}
            tokenAAddress={tokenAAddress}
            tokenBAddress={tokenBAddress}
            poolDetails={poolDetails}
          />

          <div className="w-full">
            <LiquidityActionButton
              publicKey={publicKey}
              buyTokenAccount={buyTokenAccount}
              sellTokenAccount={sellTokenAccount}
              poolDetails={poolDetails}
              tokenAAddress={tokenAAddress}
              tokenBAddress={tokenBAddress}
              isPoolLoading={isPoolLoading}
              isTokenAccountsLoading={isLoadingBuy || isLoadingSell}
              onSubmit={handleDeposit}
            />
          </div>

          <LiquidityTransactionStatus
            onRetry={handleRetry}
            onReset={handleReset}
          />
        </div>

        {poolDetails &&
          state.formValues.tokenBAmount !== "0" &&
          state.formValues.tokenAAmount !== "0" && (
            <AddLiquidityDetails
              slippage={slippage}
              tokenAAmount={state.formValues.tokenAAmount}
              tokenASymbol={buyTokenAccount?.tokenAccounts[0]?.symbol || ""}
              tokenBAmount={state.formValues.tokenBAmount}
              tokenBSymbol={sellTokenAccount?.tokenAccounts[0]?.symbol || ""}
            />
          )}
      </Box>

      <div className="flex flex-col gap-1">
        <TokenTransactionSettingsButton
          onChange={(newSlippage) => {
            setSlippage(newSlippage);
          }}
        />

        <button
          aria-label="change mode"
          className="inline-flex cursor-pointer items-center justify-center bg-green-800 p-2 text-green-300 hover:text-green-200 focus:text-green-200"
          onClick={() => {
            const urlWithParams = serialize("liquidity", {
              tokenAAddress: EMPTY_TOKEN,
              tokenBAddress: EMPTY_TOKEN,
              type: LIQUIDITY_PAGE_TYPE.CREATE_POOL,
            });
            router.push(`/${urlWithParams}`);
          }}
          type="button"
        >
          <Icon className="size-5" name="plus-circle" />
        </button>
      </div>
    </section>
  );
}

export function EnhancedLiquidityForm() {
  return (
    <LiquidityFormProvider>
      <LiquidityFormContent />
    </LiquidityFormProvider>
  );
}