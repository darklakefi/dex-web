"use client";

import { TradeStatus } from "@dex-web/grpc-client";
import { client, tanstackClient } from "@dex-web/orpc";
import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import {
  deserializeVersionedTransaction,
  toRawUnitsBigint,
} from "@dex-web/orpc/utils/solana";
import { Box, Button, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  parseAmount,
  parseAmountBigNumber,
  formatAmountInput,
  checkInsufficientBalance,
} from "@dex-web/utils";
import {
  validateWalletForSigning,
  TRANSACTION_STEPS,
  TRANSACTION_DESCRIPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BUTTON_MESSAGES,
  useTransactionState,
  createSwapTracker,
  standardizeErrorTracking,
} from "@dex-web/core";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { TokenTransactionButton } from "../../../_components/TokenTransactionButton";
import { TokenTransactionDetails } from "../../../_components/TokenTransactionDetails";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { sortSolanaAddresses } from "../../../_utils/sortSolanaAddresses";
import { dismissToast, toast } from "../../../_utils/toast";
import { SwapPageRefreshButton } from "./SwapPageRefreshButton";

export const { fieldContext, formContext } = createFormHookContexts();

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
    console.log(value);
  },
  validators: {
    onChange: swapFormSchema,
  },
};


export function SwapForm() {
  const form = useAppForm(formConfig);
  const { wallet, signTransaction, publicKey } = useWallet();
  const { trackSwap, trackError } = useAnalytics();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers
  );

  const swapState = useTransactionState(0, false, true);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [_trackDetails, setTrackDetails] = useState<{
    tradeId: string;
    trackingId: string;
  }>({
    trackingId: "",
    tradeId: "",
  });

  const tx = useTranslations("swap");
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);
  const swapTracker = createSwapTracker(trackSwap);
  const trackSwapError = standardizeErrorTracking(trackError, "swap_initiation");
  const [slippage, setSlippage] = useState("0.5");

  const { data: poolDetails } = useSuspenseQuery(
    tanstackClient.pools.getPoolDetails.queryOptions({
      input: {
        tokenXMint: tokenBAddress,
        tokenYMint: tokenAAddress,
      },
    })
  );

  const { data: buyTokenAccount, refetch: refetchBuyTokenAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenAAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      })
    );

  const { data: sellTokenAccount, refetch: refetchSellTokenAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenBAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      })
    );

  const [quote, setQuote] = useState<GetQuoteOutput | null>(null);

  const isXtoY = poolDetails?.tokenXMint === tokenBAddress;


  const requestSigning = async (
    unsignedTransaction: string,
    tradeId: string,
    trackingId: string
  ) => {
    try {
      validateWalletForSigning({ publicKey, signTransaction });

      swapState.setStep(2);
      swapState.setLoading(true);
      toast({
        description: TRANSACTION_DESCRIPTIONS.STEP_2.SWAP,
        title: TRANSACTION_STEPS.STEP_2.SWAP,
        variant: "loading",
      });

      const transaction = deserializeVersionedTransaction(unsignedTransaction);
      const signedTransaction = await signTransaction(transaction);

      const sellAmount = parseAmount(form.state.values.tokenAAmount);
      const buyAmount = parseAmount(form.state.values.tokenBAmount);
      swapTracker.trackSigned({
        fromAmount: sellAmount,
        fromToken: tokenAAddress || "",
        toAmount: buyAmount,
        toToken: tokenBAddress || "",
      });
      const signedTransactionBase64 = Buffer.from(
        signedTransaction.serialize()
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
      toast({
        description: TRANSACTION_DESCRIPTIONS.STEP_3.SWAP,
        title: TRANSACTION_STEPS.STEP_3.SWAP,
        variant: "loading",
      });

      const signedTxResponse = await client.dexGateway.submitSignedTransaction(
        signedTxRequest
      );

      if (signedTxResponse.success) {
        const sellAmount = parseAmount(form.state.values.tokenAAmount);
        const buyAmount = parseAmount(form.state.values.tokenBAmount);
        swapTracker.trackSubmitted({
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
      dismissToast();
      toast({
        description: `${
          error instanceof Error ? error.message : "Unknown error occurred"
        }, trackingId: ${trackingId}`,
        title: "Signing Error",
        variant: "error",
      });

      trackSwapError(error, {
        trackingId,
        tradeId,
      });

      swapState.reset();
    }
  };

  const checkSwapStatus = async (
    trackingId: string,
    tradeId: string,
    maxAttempts = 10
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      if (!trackingId || !tradeId) return;
      const response = await client.dexGateway.checkTradeStatus({
        trackingId,
        tradeId,
      });

      dismissToast();
      const squads = isSquadsX(wallet);

      if (squads) {
        if (response.status === TradeStatus.CONFIRMED) {
          resetButtonState();
          toast({
            description: tx("squadsX.responseStatus.confirmed.description"),
            title: tx("squadsX.responseStatus.confirmed.title"),
            variant: "success",
          });
          return;
        }
      }

      if (
        response.status === TradeStatus.SETTLED ||
        response.status === TradeStatus.SLASHED
      ) {
        swapState.reset();
        toast({
          description: squads
            ? tx("swap.squadsX.responseStatus.confirmed.description")
            : `SWAPPED ${form.state.values.tokenAAmount} ${tokenBAddress} FOR ${form.state.values.tokenBAmount} ${tokenAAddress}. protected from MEV attacks.`,
          title: squads
            ? tx("swap.squadsX.responseStatus.confirmed.title")
            : SUCCESS_MESSAGES.SWAP_COMPLETE,
          variant: "success",
        });

        const sellAmount = parseAmount(form.state.values.tokenAAmount);
        const buyAmount = parseAmount(form.state.values.tokenBAmount);
        swapTracker.trackConfirmed({
          fromAmount: sellAmount,
          fromToken: tokenAAddress || "",
          toAmount: buyAmount,
          toToken: tokenBAddress || "",
          transactionHash: trackingId,
        });

        refetchBuyTokenAccount();
        refetchSellTokenAccount();
        return;
      }

      if (
        response.status === TradeStatus.CANCELLED ||
        response.status === TradeStatus.FAILED
      ) {
        swapState.reset();
        const squads = isSquadsX(wallet);
        toast({
          description: squads
            ? tx("squadsX.responseStatus.failed.description")
            : `Trade ${response.status}!, trackingId: ${trackingId}`,
          title: squads
            ? tx("squadsX.responseStatus.failed.title")
            : `Trade ${response.status}`,
          variant: "error",
        });

        const sellAmount = parseAmount(form.state.values.tokenAAmount);
        const buyAmount = parseAmount(form.state.values.tokenBAmount);
        swapTracker.trackFailed({
          fromAmount: sellAmount,
          fromToken: tokenAAddress || "",
          toAmount: buyAmount,
          toToken: tokenBAddress || "",
          transactionHash: trackingId,
        });

        return;
      }

      toast({
        description: `TrackingId: ${trackingId}`,
        title: "Checking trade status",
        variant: "loading",
      });

      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    toast({
      description: `TrackingId: ${trackingId}`,
      title: "Failed to check trade status",
      variant: "error",
    });
  };

  const getSwap = async () => {
    if (!publicKey) {
      toast({
        description: ERROR_MESSAGES.MISSING_WALLET_INFO,
        title: "Swap Error",
        variant: "error",
      });
      return;
    }

    const sellAmount = parseAmount(form.state.values.tokenAAmount);
    const buyAmount = parseAmount(form.state.values.tokenBAmount);
    swapTracker.trackInitiated({
      fromAmount: sellAmount,
      fromToken: tokenAAddress || "",
      toAmount: buyAmount,
      toToken: tokenBAddress || "",
    });

    toast({
      description: TRANSACTION_DESCRIPTIONS.STEP_1.SWAP,
      title: TRANSACTION_STEPS.STEP_1.SWAP,
      variant: "loading",
    });
    swapState.setStep(1);
    swapState.setLoading(true);

    try {
      const formState = form.state.values;
      const sellAmount = parseAmount(formState.tokenAAmount);
      const buyAmount = parseAmount(formState.tokenBAmount);

      if (!tokenAAddress || !tokenBAddress) {
        throw new Error(ERROR_MESSAGES.MISSING_TOKEN_ADDRESSES);
      }

      const sortedTokens = sortSolanaAddresses(tokenAAddress, tokenBAddress);

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      const sellTokenDecimals =
        sellTokenAccount?.tokenAccounts[0]?.decimals || 0;
      const buyTokenDecimals = buyTokenAccount?.tokenAccounts[0]?.decimals || 0;

      const buyAmountRaw = toRawUnitsBigint(buyAmount, buyTokenDecimals);
      const slippageFactor = BigNumber(1).minus(
        BigNumber(slippage || 0).dividedBy(100)
      );
      const minOutRaw = BigNumber(buyAmountRaw.toString())
        .multipliedBy(slippageFactor)
        .integerValue(BigNumber.ROUND_DOWN);

      const response = await client.dexGateway.getSwap({
        amountIn: toRawUnitsBigint(sellAmount, sellTokenDecimals),
        isSwapXToY: isXtoY,
        minOut: BigInt(minOutRaw.toString()),
        trackingId: `swap-${Date.now()}`,
        tokenMintX: tokenXAddress,
        tokenMintY: tokenYAddress,
        userAddress: publicKey.toBase58(),
      });

      if (response.success && response.unsignedTransaction) {
        requestSigning(
          response.unsignedTransaction,
          response.tradeId,
          response.trackingId
        );
      } else {
        throw new Error("Failed to create swap transaction");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast({
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        title: "Swap Error",
        variant: "error",
      });

      trackSwapError(error, {
        amount: form.state.values.tokenAAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      });

      swapState.reset();
    }
  };

  const handleSwap = async () => {
    getQuote({
      amountIn: form.state.values.tokenAAmount,
      isXtoY,
      slippage: parseFloat(slippage),
      type: "sell",
    }).then(getSwap);
  };

  const getQuote = async ({
    amountIn,
    type,
    isXtoY,
    slippage,
  }: {
    amountIn: string;
    type: "buy" | "sell";
    isXtoY: boolean;
    slippage: number;
  }) => {
    const amountInNumber = parseAmount(amountIn);
    if (!poolDetails || parseAmountBigNumber(amountIn).lte(0)) return;

    setIsLoadingQuote(true);
    swapState.setDisabled(true);
    const quote = await client.swap.getSwapQuote({
      amountIn: amountInNumber,
      isXtoY,
      slippage,
      tokenXMint: poolDetails.tokenXMint,
      tokenYMint: poolDetails.tokenYMint,
    });
    setQuote(quote);
    if (type === "sell") {
      form.setFieldValue("tokenBAmount", String(quote.amountOut));
    } else {
      form.setFieldValue("tokenAAmount", String(quote.amountOut));
    }
    swapState.setDisabled(false);
    setIsLoadingQuote(false);
  };

  const debouncedGetQuote = useDebouncedCallback(getQuote, 500);

  useEffect(() => {
    const amountIn = form.state.values.tokenAAmount;
    const amountInNumber = amountIn?.replace(/,/g, "") || "0";

    if (poolDetails && BigNumber(amountInNumber).gt(0)) {
      const intervalId = setInterval(() => {
        debouncedGetQuote({
          amountIn,
          isXtoY,
          slippage: parseFloat(slippage),
          type: "sell",
        });
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [
    poolDetails,
    form.state.values.tokenAAmount,
    isXtoY,
    slippage,
    debouncedGetQuote,
  ]);

  const checkInsufficientBalanceState = (input: string) => {
    const hasInsufficientBalance = checkInsufficientBalance(
      input,
      sellTokenAccount?.tokenAccounts[0]
    );
    setIsInsufficientBalance(hasInsufficientBalance);
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell"
  ) => {
    const value = formatAmountInput(e.target.value);

    if (type === "sell") {
      checkInsufficientBalanceState(value);
    }

    if (parseAmountBigNumber(value).gt(0)) {
      debouncedGetQuote({
        amountIn: value,
        isXtoY,
        slippage: parseFloat(slippage),
        type,
      });
    } else {
      swapState.setDisabled(true);
    }
  };

  const onClickSwapToken = () => {
    const sellAmount = parseAmount(form.state.values.tokenAAmount);
    checkInsufficientBalanceState(String(sellAmount));
    if (!poolDetails || parseAmountBigNumber(String(sellAmount)).lte(0)) return;

    debouncedGetQuote({
      amountIn: form.state.values.tokenAAmount,
      isXtoY: !isXtoY,
      slippage: parseFloat(slippage),
      type: "sell",
    });
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

      const accountAmount = sellTokenAccount?.tokenAccounts[0]?.amount || 0;
      const decimal = sellTokenAccount?.tokenAccounts[0]?.decimals || 0;
      const symbol = sellTokenAccount?.tokenAccounts[0]?.symbol || "";

      if (parseAmountBigNumber(inputClean).gt(convertToDecimal(accountAmount, decimal))) {
        return `${BUTTON_MESSAGES.INSUFFICIENT_BALANCE} ${symbol}`;
      }
    }

    if (quote) {
      const slippageImpact = quote.priceImpactPercentage;
      if (slippageImpact > 0.5) {
        return BUTTON_MESSAGES.HIGH_PRICE_IMPACT.replace(
          "{value}",
          slippageImpact.toString()
        );
      }
    }

    return message;
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between md:hidden">
        <Text.Heading className="text-green-200">Swap</Text.Heading>
        <div className="flex gap-3">
          <TokenTransactionSettingsButton
            onChange={(slippage) => {
              setSlippage(slippage);
              debouncedGetQuote({
                amountIn: form.state.values.tokenAAmount,
                isXtoY,
                slippage: parseFloat(slippage),
                type: "sell",
              });
            }}
          />
          <SwapPageRefreshButton
            onClick={() => {
              debouncedGetQuote({
                amountIn: form.state.values.tokenAAmount,
                isXtoY,
                slippage: parseFloat(slippage),
                type: "sell",
              });
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
                    tokenAccount={sellTokenAccount?.tokenAccounts[0]}
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
                    tokenAccount={buyTokenAccount?.tokenAccounts[0]}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </Box>
            <div className="w-full">
              {!publicKey ? (
                <ConnectWalletButton className="w-full py-3" />
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
                  href={`/liquidity/?tokenAAddress=${tokenAAddress}&tokenBAddress=${tokenBAddress}`}
                >
                  {BUTTON_MESSAGES.CREATE_POOL}
                </Button>
              )}
            </div>
          </div>
          {quote && (
            <TokenTransactionDetails
              quote={quote}
              slippage={slippage}
              tokenBuyMint={tokenAAddress}
              tokenSellMint={tokenBAddress}
            />
          )}
        </Box>
        <div className="hidden flex-col gap-1 md:flex">
          <TokenTransactionSettingsButton
            onChange={(slippage) => {
              setSlippage(slippage);
              debouncedGetQuote({
                amountIn: form.state.values.tokenAAmount,
                isXtoY,
                slippage: parseFloat(slippage),
                type: "sell",
              });
            }}
          />
          <SwapPageRefreshButton
            isLoading={isLoadingQuote}
            onClick={() => {
              debouncedGetQuote({
                amountIn: form.state.values.tokenAAmount,
                isXtoY,
                slippage: parseFloat(slippage),
                type: "sell",
              });

              refetchBuyTokenAccount();
              refetchSellTokenAccount();
            }}
          />
        </div>
      </section>
    </div>
  );
}
