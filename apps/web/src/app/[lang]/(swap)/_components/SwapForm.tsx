"use client";
import {
  BUTTON_MESSAGES,
  ERROR_MESSAGES,
  SwapTxStatus,
  TRANSACTION_STEPS,
  useSwapTracking,
  useTokenAccounts,
  useTransactionSigning,
  useTransactionState,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import { deserializeVersionedTransaction } from "@dex-web/orpc/utils/solana";
import { Box, Button, Text } from "@dex-web/ui";
import {
  checkInsufficientBalance,
  convertToDecimal,
  formatAmountInput,
  getGatewayTokenAddress,
  parseAmount,
  parseAmountBigNumber,
  sortSolanaAddresses,
  toRawUnitsBigNumberAsBigInt,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { usePageVisibility } from "../../../../hooks/usePageVisibility";
import { usePoolData } from "../../../../hooks/usePoolData";
import { useTokenPricesMap } from "../../../../hooks/useTokenPrices";
import {
  useWalletAdapter,
  useWalletPublicKey,
} from "../../../../hooks/useWalletCache";
import { logger } from "../../../../utils/logger";
import { FormFieldset } from "../../../_components/FormFieldset";
import { useReferralCode } from "../../../_components/ReferralCodeProvider";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { TokenTransactionButton } from "../../../_components/TokenTransactionButton";
import { TokenTransactionDetails } from "../../../_components/TokenTransactionDetails";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { WalletButton } from "../../../_components/WalletButton";
import { LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { dismissToast, toast } from "../../../_utils/toast";
import { SwapPageRefreshButton } from "./SwapPageRefreshButton";

const { fieldContext, formContext } = createFormHookContexts();

const swapFormSchema = z.object({
  tokenAAmount: z.string(),
  tokenBAmount: z.string(),
});

type SwapFormSchema = z.infer<typeof swapFormSchema>;

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },

  fieldContext,
  formComponents: {},
  formContext,
});

const formConfig = {
  defaultValues: {
    tokenAAmount: "0",
    tokenBAmount: "0",
  } satisfies SwapFormSchema,
  onSubmit: async ({
    value,
  }: {
    value: { tokenAAmount: string; tokenBAmount: string };
  }) => {
    logger.log(value);
  },
  validators: {
    onBlur: swapFormSchema,
  },
};

export function SwapForm() {
  const form = useAppForm(formConfig);
  const { signTransaction, wallet, connected } = useWallet();
  const { data: publicKey } = useWalletPublicKey();
  const { data: walletAdapter } = useWalletAdapter();
  const { trackSwap, trackError } = useAnalytics();
  const queryClient = useQueryClient();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const { incomingReferralCode } = useReferralCode();

  const swapState = useTransactionState(0, false, true);
  const [_trackDetails, setTrackDetails] = useState<{
    tradeId: string;
    trackingId: string;
  }>({
    trackingId: "",
    tradeId: "",
  });

  const i18n = useTranslations("swap");
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  const { signTransactionWithValidation } = useTransactionSigning({
    publicKey: publicKey || null,
    signTransaction,
  });

  const {
    trackInitiated,
    trackSigned,
    trackSubmitted,
    trackConfirmed,
    trackFailed,
    trackError: trackSwapError,
  } = useSwapTracking({
    trackError: (error: unknown, context?: Record<string, unknown>) => {
      trackError({
        context: "swap",
        details: context,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    trackSwap,
  });

  const toasts = useTransactionToasts({
    customMessages: {
      squadsXFailure: {
        description: i18n("squadsX.responseStatus.failed.description"),
        title: i18n("squadsX.responseStatus.failed.title"),
      },
      squadsXSuccess: {
        description: i18n("squadsX.responseStatus.confirmed.description"),
        title: i18n("squadsX.responseStatus.confirmed.title"),
      },
    },
    dismissToast,
    isSquadsX: isSquadsX(walletAdapter?.wallet),
    toast,
    transactionType: "SWAP",
  });

  const statusChecker = useTransactionStatus({
    checkStatus: async (trackingId: string, tradeId?: string) => {
      const response = await client.dexGateway.checkTradeStatus({
        trackingId,
        tradeId: tradeId || "",
      });
      return {
        data: response,
        status: response.status.toString(),
      };
    },
    failStates: [SwapTxStatus.CANCELLED, SwapTxStatus.FAILED].map((s) =>
      s.toString(),
    ),
    maxAttempts: 10,
    onFailure: (result, trackingId) => {
      swapState.reset();
      const sellAmount = parseAmount(form.state.values.tokenAAmount);
      const buyAmount = parseAmount(form.state.values.tokenBAmount);

      const status =
        result.status === SwapTxStatus.CANCELLED.toString()
          ? "Cancelled"
          : "Failed";

      toasts.showErrorToast(`Trade ${status}!`, {
        trackingId: trackingId || _trackDetails.trackingId,
      });

      trackFailed({
        fromAmount: sellAmount,
        fromToken: tokenAAddress || "",
        toAmount: buyAmount,
        toToken: tokenBAddress || "",
        transactionHash: _trackDetails.trackingId,
      });
    },
    onStatusUpdate: (_status, _attempt, trackingId) => {
      toasts.dismiss();
      toasts.showStatusToast(
        `TrackingId: ${_trackDetails.trackingId || trackingId}`,
      );
    },
    onSuccess: (result) => {
      const sellAmount = parseAmount(form.state.values.tokenAAmount);
      const buyAmount = parseAmount(form.state.values.tokenBAmount);

      if (
        isSquadsX(walletAdapter?.wallet) &&
        result.data?.status.toString() === "CONFIRMED"
      ) {
        resetButtonState();
        form.reset();
        toasts.showSuccessToast();
        return;
      }

      swapState.reset();
      form.reset();
      const successMessage = isSquadsX(walletAdapter?.wallet)
        ? undefined
        : `SWAPPED ${form.state.values.tokenAAmount} ${tokenBAddress} FOR ${form.state.values.tokenBAmount} ${tokenAAddress}. protected from MEV attacks.`;

      toasts.dismiss();

      toasts.showSuccessToast(successMessage);

      trackConfirmed({
        fromAmount: sellAmount,
        fromToken: tokenAAddress || "",
        toAmount: buyAmount,
        toToken: tokenBAddress || "",
        transactionHash: _trackDetails.trackingId,
      });

      if (tokenAAddress && tokenBAddress) {
        const { tokenXAddress: tokenXMint, tokenYAddress: tokenYMint } =
          sortSolanaAddresses(tokenAAddress, tokenBAddress);

        queryClient.invalidateQueries({
          queryKey: tanstackClient.pools.getPoolReserves.key({
            input: { tokenXMint, tokenYMint },
          }),
        });

        if (publicKey) {
          queryClient.invalidateQueries({
            queryKey: tanstackClient.helius.getTokenAccounts.key({
              input: { mint: tokenXMint, ownerAddress: publicKey.toBase58() },
            }),
          });

          queryClient.invalidateQueries({
            queryKey: tanstackClient.helius.getTokenAccounts.key({
              input: { mint: tokenYMint, ownerAddress: publicKey.toBase58() },
            }),
          });
        }
      }
    },
    onTimeout: () => {
      toasts.showErrorToast("Failed to check trade status", {
        trackingId: _trackDetails.trackingId,
      });
    },
    retryDelay: 2000,
    successStates: [SwapTxStatus.SETTLED, SwapTxStatus.SLASHED].map((s) =>
      s.toString(),
    ),
  });

  const { tokenXAddress: sortedTokenXMint, tokenYAddress: sortedTokenYMint } =
    useMemo(() => {
      if (!tokenAAddress || !tokenBAddress) {
        return {
          tokenXAddress: tokenAAddress || "",
          tokenYAddress: tokenBAddress || "",
        };
      }
      return sortSolanaAddresses(tokenAAddress, tokenBAddress);
    }, [tokenAAddress, tokenBAddress]);

  const { data: poolDetails } = usePoolData({
    priority: "high",
    tokenXMint: sortedTokenXMint || "",
    tokenYMint: sortedTokenYMint || "",
  });

  const {
    tokenAAccount,
    tokenBAccount,
    refetchTokenAAccount,
    refetchTokenBAccount,
  } = useTokenAccounts({
    publicKey: publicKey || null,
    tanstackClient,
    tokenAAddress,
    tokenBAddress,
  });

  const { prices: tokenPrices } = useTokenPricesMap([
    tokenAAddress,
    tokenBAddress,
  ]);

  const [amountIn, setAmountIn] = useState<string>("");
  const [swapType, setSwapType] = useState<"buy" | "sell">("sell");

  const isXtoY = useMemo(
    () => tokenAAddress === sortedTokenXMint,
    [tokenAAddress, sortedTokenXMint],
  );

  const [debouncedAmountIn] = useDebouncedValue(amountIn, { wait: 500 });

  const isVisible = usePageVisibility();

  const {
    data: quote,
    isLoading: isLoadingQuote,
    refetch: refetchQuote,
  } = useQuery({
    enabled: Boolean(
      poolDetails &&
        debouncedAmountIn &&
        parseAmountBigNumber(debouncedAmountIn).gt(0),
    ),
    queryFn: async () => {
      if (!poolDetails || !debouncedAmountIn) return null;

      const amountInNumber = parseAmount(debouncedAmountIn);
      if (parseAmountBigNumber(debouncedAmountIn).lte(0)) return null;

      const result = await client.swap.getSwapQuote({
        amountIn: amountInNumber,
        isXtoY,
        slippage: parseFloat(slippage),
        tokenXMint: sortedTokenXMint,
        tokenYMint: sortedTokenYMint,
      });

      return result;
    },
    queryKey: [
      "swap-quote",
      debouncedAmountIn,
      isXtoY,
      slippage,
      sortedTokenXMint,
      sortedTokenYMint,
    ],
    refetchInterval: isVisible ? 10000 : false,
    refetchIntervalInBackground: false,
    staleTime: 8000,
  });
  useEffect(() => {
    if (quote) {
      if (swapType === "sell") {
        form.setFieldValue("tokenBAmount", String(quote.amountOut));
      } else {
        form.setFieldValue("tokenAAmount", String(quote.amountOut));
      }
      swapState.setDisabled(false);
    }
  }, [quote, swapType, form.setFieldValue, swapState.setDisabled]);

  useEffect(() => {
    swapState.setDisabled(isLoadingQuote);
  }, [isLoadingQuote, swapState]);

  const resetButtonState = () => {
    swapState.reset();
  };

  const requestSigning = async (
    unsignedTransaction: string,
    tradeId: string,
    trackingId: string,
  ) => {
    try {
      swapState.setStep(2);
      swapState.setLoading(true);
      toasts.showStepToast(2);

      const transaction = deserializeVersionedTransaction(unsignedTransaction);
      const signedTransaction =
        await signTransactionWithValidation(transaction);

      const sellAmount = parseAmount(form.state.values.tokenAAmount);
      const buyAmount = parseAmount(form.state.values.tokenBAmount);
      trackSigned({
        fromAmount: sellAmount,
        fromToken: tokenAAddress || "",
        toAmount: buyAmount,
        toToken: tokenBAddress || "",
      });
      const signedTransactionBase64 = Buffer.from(
        signedTransaction.serialize(),
      ).toString("base64");

      setTrackDetails({
        trackingId,
        tradeId,
      });
      const signedTxRequest = {
        signedTransaction: signedTransactionBase64,
        trackingId,
        tradeId,
      };

      swapState.setStep(3);
      swapState.setLoading(true);
      toasts.showStepToast(3);

      const signedTxResponse =
        await client.dexGateway.submitSignedTransaction(signedTxRequest);

      if (signedTxResponse.success) {
        const sellAmount = parseAmount(form.state.values.tokenAAmount);
        const buyAmount = parseAmount(form.state.values.tokenBAmount);
        trackSubmitted({
          fromAmount: sellAmount,
          fromToken: tokenAAddress || "",
          toAmount: buyAmount,
          toToken: tokenBAddress || "",
          transactionHash: trackingId,
        });
        checkSwapStatus(trackingId, tradeId);
      } else {
        throw new Error("Failed to submit signed transaction");
      }
    } catch (error) {
      console.error("Signing error:", error);
      toasts.dismiss();
      toasts.showErrorToast(
        error instanceof Error ? error.message : "Unknown error occurred",
        {
          trackingId,
        },
      );

      trackSwapError(error, {
        trackingId,
        tradeId,
      });

      swapState.reset();
    }
  };

  const checkSwapStatus = async (trackingId: string, tradeId: string) => {
    if (!trackingId || !tradeId) return;
    setTrackDetails({ trackingId, tradeId });
    await statusChecker.checkTransactionStatus(trackingId, tradeId);
  };

  const getSwap = async () => {
    if (!publicKey) {
      toasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
      return;
    }

    const sellAmount = parseAmount(form.state.values.tokenAAmount);
    const buyAmount = parseAmount(form.state.values.tokenBAmount);
    trackInitiated({
      fromAmount: sellAmount,
      fromToken: tokenAAddress || "",
      toAmount: buyAmount,
      toToken: tokenBAddress || "",
    });

    toasts.showStepToast(1);
    swapState.setStep(1);
    swapState.setLoading(true);

    try {
      const formState = form.state.values;
      const sellAmount = formatAmountInput(formState.tokenAAmount);
      const buyAmount = formatAmountInput(formState.tokenBAmount);

      if (!tokenAAddress || !tokenBAddress) {
        throw new Error(ERROR_MESSAGES.MISSING_TOKEN_ADDRESSES);
      }

      const sortedTokens = sortSolanaAddresses(tokenAAddress, tokenBAddress);

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      const sellTokenDecimals = tokenAAccount?.tokenAccounts[0]?.decimals || 0;
      const buyTokenDecimals = tokenBAccount?.tokenAccounts[0]?.decimals || 0;

      const buyAmountRaw = toRawUnitsBigNumberAsBigInt(
        buyAmount,
        buyTokenDecimals,
      );
      const slippageFactor = BigNumber(1).minus(
        BigNumber(slippage || 0).dividedBy(100),
      );
      const minOutRaw = BigNumber(buyAmountRaw.toString())
        .multipliedBy(slippageFactor)
        .integerValue(BigNumber.ROUND_DOWN);

      const gatewayTokenXAddress = getGatewayTokenAddress(tokenXAddress);
      const gatewayTokenYAddress = getGatewayTokenAddress(tokenYAddress);

      const response = await client.dexGateway.createUnsignedTransaction({
        amountIn: toRawUnitsBigNumberAsBigInt(sellAmount, sellTokenDecimals),
        isSwapXToY: isXtoY,
        minOut: BigInt(minOutRaw.toString()),
        refCode: incomingReferralCode || "",
        tokenMintX: gatewayTokenXAddress,
        tokenMintY: gatewayTokenYAddress,
        trackingId: `swap-${Date.now()}`,
        userAddress: publicKey.toBase58(),
      });

      if (response.success && response.unsignedTransaction) {
        requestSigning(
          response.unsignedTransaction,
          response.tradeId,
          response.trackingId || `swap-${Date.now()}`,
        );
      } else {
        throw new Error("Failed to create swap transaction");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toasts.showErrorToast(
        error instanceof Error ? error.message : "Unknown error occurred",
      );

      trackSwapError(error, {
        amount: form.state.values.tokenAAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      });

      swapState.reset();
    }
  };

  const handleSwap = async () => {
    await refetchQuote();
    getSwap();
  };

  const checkInsufficientBalanceState = (input: string) => {
    const hasInsufficientBalance = checkInsufficientBalance(
      input,
      tokenAAccount?.tokenAccounts[0],
    );
    setIsInsufficientBalance(hasInsufficientBalance);
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = formatAmountInput(e.target.value);

    if (type === "sell") {
      checkInsufficientBalanceState(value);
      setAmountIn(value);
      setSwapType(type);
    }

    if (parseAmountBigNumber(value).lte(0)) {
      swapState.setDisabled(true);
    }
  };

  const onClickSwapToken = () => {
    const sellAmount = parseAmount(form.state.values.tokenAAmount);
    checkInsufficientBalanceState(String(sellAmount));
    if (!poolDetails || parseAmountBigNumber(String(sellAmount)).lte(0)) return;

    setAmountIn(form.state.values.tokenAAmount);
    setSwapType("sell");
  };

  const getButtonMessage = () => {
    const message = BUTTON_MESSAGES.SWAP;

    if (swapState.step === 1) {
      return TRANSACTION_STEPS.STEP_1.SWAP;
    }

    if (swapState.step === 2) {
      return TRANSACTION_STEPS.STEP_2.SWAP;
    }

    if (swapState.step === 3) {
      return TRANSACTION_STEPS.STEP_3.SWAP;
    }

    if (isLoadingQuote) {
      return BUTTON_MESSAGES.LOADING;
    }

    if (form.state.values.tokenAAmount) {
      const inputClean = formatAmountInput(form.state.values.tokenAAmount);
      if (parseAmountBigNumber(inputClean).lte(0)) {
        return BUTTON_MESSAGES.ENTER_AMOUNT;
      }

      const accountAmount = tokenAAccount?.tokenAccounts[0]?.amount || 0;
      const decimal = tokenAAccount?.tokenAccounts[0]?.decimals || 0;
      const symbol = tokenAAccount?.tokenAccounts[0]?.symbol || "";

      if (
        convertToDecimal(parseAmountBigNumber(inputClean).toString(), 0).gt(
          convertToDecimal(accountAmount, decimal),
        )
      ) {
        return `${BUTTON_MESSAGES.INSUFFICIENT_BALANCE} ${symbol}`;
      }
    }

    if (quote) {
      const slippageImpact = quote.priceImpactPercentage;
      if (slippageImpact >= 1) {
        return BUTTON_MESSAGES.HIGH_PRICE_IMPACT.replace(
          "{value}",
          slippageImpact.toString(),
        );
      }
    }

    return message;
  };

  const onChangeSlippage = (newSlippage: string) => {
    setSlippage(newSlippage);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between md:hidden">
        <Text.Heading className="text-green-200">Swap</Text.Heading>
        <div className="flex gap-3">
          <TokenTransactionSettingsButton onChange={onChangeSlippage} />
          <SwapPageRefreshButton
            onClick={() => {
              refetchQuote();
            }}
          />
        </div>
      </div>
      <section className="flex gap-1">
        <div className="hidden size-9 md:block" />
        <Box className="bg-transparent md:bg-green-700 md:p-6" padding="none">
          <div className="flex flex-col gap-4">
            <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
              <div>
                <Text.Body2
                  as="label"
                  className="mb-3 block text-green-300 uppercase"
                >
                  Selling
                </Text.Body2>
                <SelectTokenButton returnUrl={""} type="sell" />
              </div>
              <form.Field name="tokenAAmount">
                {(field) => (
                  <FormFieldset
                    maxDecimals={5}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleAmountChange(e, "sell");
                      field.handleChange(e.target.value);
                    }}
                    tokenAccount={tokenAAccount?.tokenAccounts[0]}
                    tokenPrice={
                      tokenAAddress ? tokenPrices[tokenAAddress] : null
                    }
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </Box>
            <div className="flex items-center justify-center">
              <TokenTransactionButton
                onClickTokenTransaction={onClickSwapToken}
              />
            </div>
            <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
              <div>
                <Text.Body2
                  as="label"
                  className="mb-3 block text-green-300 uppercase"
                >
                  Buying
                </Text.Body2>
                <SelectTokenButton type="buy" />
              </div>
              <form.Field name="tokenBAmount">
                {(field) => (
                  <FormFieldset
                    disabled={true}
                    maxDecimals={5}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleAmountChange(e, "buy");
                      field.handleChange(e.target.value);
                    }}
                    tokenAccount={tokenBAccount?.tokenAccounts[0]}
                    tokenPrice={
                      tokenBAddress ? tokenPrices[tokenBAddress] : null
                    }
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </Box>
            <div className="w-full">
              {!wallet || !connected ? (
                <WalletButton className="w-full py-3" />
              ) : poolDetails ? (
                <Button
                  className="w-full cursor-pointer py-3 leading-6"
                  disabled={
                    swapState.isDisabled ||
                    isInsufficientBalance ||
                    isLoadingQuote ||
                    swapState.isLoading
                  }
                  loading={swapState.isLoading || isLoadingQuote}
                  onClick={handleSwap}
                >
                  {getButtonMessage()}
                </Button>
              ) : (
                <Button
                  as={Link}
                  className="w-full cursor-pointer py-3 leading-6"
                  href={`/liquidity/?tokenAAddress=${tokenAAddress}&tokenBAddress=${tokenBAddress}&type=${LIQUIDITY_PAGE_TYPE.CREATE_POOL}`}
                >
                  {BUTTON_MESSAGES.CREATE_POOL}
                </Button>
              )}
            </div>
          </div>
          {quote && (
            <TokenTransactionDetails
              onChangeSlippage={onChangeSlippage}
              quote={quote}
              slippage={slippage}
              tokenBuyMint={tokenAAddress}
              tokenSellMint={tokenBAddress}
            />
          )}
        </Box>
        <div className="hidden flex-col gap-1 md:flex">
          <TokenTransactionSettingsButton onChange={onChangeSlippage} />
          <SwapPageRefreshButton
            isLoading={isLoadingQuote}
            onClick={() => {
              refetchQuote();
              refetchTokenAAccount();
              refetchTokenBAccount();
            }}
          />
        </div>
      </section>
    </div>
  );
}
