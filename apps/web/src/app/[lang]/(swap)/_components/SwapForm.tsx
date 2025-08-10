"use client";

import { client, TradeStatus, tanstackClient } from "@dex-web/orpc";
import type { GetQuoteOutput } from "@dex-web/orpc/schemas";
import { Box, Button, Text } from "@dex-web/ui";
import { convertToDecimal } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { TokenTransactionButton } from "../../../_components/TokenTransactionButton";
import { TokenTransactionDetails } from "../../../_components/TokenTransactionDetails";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { sortSolanaAddresses } from "../../../_utils/sortSolanaAddresses";
import { dismissToast, toast } from "../../../_utils/toast";
import { SwapPageRefreshButton } from "./SwapPageRefreshButton";

export const { fieldContext, formContext } = createFormHookContexts();

const swapFormSchema = z.object({
  buyAmount: z.string(),
  sellAmount: z.string(),
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
    buyAmount: "0",
    sellAmount: "0",
  } satisfies SwapFormSchema,
  onSubmit: async ({
    value,
  }: {
    value: { buyAmount: string; sellAmount: string };
  }) => {
    console.log(value);
  },
  validators: {
    onChange: swapFormSchema,
  },
};

const BUTTON_MESSAGE = {
  ENTER_AMOUNT: "enter an amount",
  HIGH_PRICE_IMPACT: "CONFIRM SWAP WITH {value}% PRICE IMPACT",
  INSUFFICIENT_BALANCE: "insufficient",
  LOADING: "loading",
  STEP_1: "ENCRYPTING TRADE PARAMETERs [1/3]",
  STEP_2: "Confirm transaction in your wallet [2/3]",
  STEP_3: "Processing transaction [3/3]",
  SWAP: "swap",
};

export function SwapForm() {
  const form = useAppForm(formConfig);
  const { signTransaction, publicKey } = useWallet();
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const [swapStep, setSwapStep] = useState(0);
  const [isDisableSwap, setIsDisableSwapButton] = useState(true);
  const [isLoadingSwapButton, setIsLoadingSwapButton] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [_trackDetails, setTrackDetails] = useState<{
    tradeId: string;
    trackingId: string;
  }>({
    trackingId: "",
    tradeId: "",
  });
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);
  const [isUseSlippage, setIsUseSlippage] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  const { data: poolDetails } = useSuspenseQuery(
    tanstackClient.getPoolDetails.queryOptions({
      input: {
        tokenXMint: sellTokenAddress,
        tokenYMint: buyTokenAddress,
      },
    }),
  );

  const { data: buyTokenAccount, refetch: refetchBuyTokenAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: buyTokenAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      }),
    );

  const { data: sellTokenAccount, refetch: refetchSellTokenAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: sellTokenAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      }),
    );

  const [quote, setQuote] = useState<GetQuoteOutput | null>(null);

  const isXtoY = poolDetails?.tokenXMint === sellTokenAddress;

  const resetButtonState = () => {
    setSwapStep(0);
    setIsLoadingSwapButton(false);
  };

  const requestSigning = async (
    unsignedTransaction: string,
    tradeId: string,
    trackingId: string,
  ) => {
    try {
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signTransaction)
        throw new Error("Wallet does not support transaction signing!");

      setSwapStep(2);
      setIsLoadingSwapButton(true);
      toast({
        description:
          "Tokens will be secured until slippage verification completes.",
        title: "Confirm trade [2/3]",
        variant: "loading",
      });

      const unsignedTransactionBuffer = Buffer.from(
        unsignedTransaction,
        "base64",
      );
      const transactionJson = unsignedTransactionBuffer;
      const transaction = Transaction.from(transactionJson);

      const signedTransaction = await signTransaction(transaction);
      const signedTransactionBase64 = signedTransaction
        .serialize()
        .toString("base64");
      // Prepare signed transaction request

      setTrackDetails({
        trackingId,
        tradeId,
      });
      const signedTxRequest = {
        signed_transaction: signedTransactionBase64,
        tracking_id: trackingId,
        trade_id: tradeId,
      };

      setSwapStep(3);
      setIsLoadingSwapButton(true);
      toast({
        description:
          "Checking if swap stayed within your hidden slippage tolerance before finalizing trade.",
        title: "Verify slippage requirements [3/3]",
        variant: "loading",
      });

      const signedTxResponse =
        await client.dexGateway.submitSignedTransaction(signedTxRequest);

      if (signedTxResponse.success) {
        checkSwapStatus(trackingId, tradeId);
      } else {
        throw new Error("Failed to submit signed transaction");
      }
    } catch (error) {
      console.error("Signing error:", error);
      dismissToast();
      toast({
        description: `${error instanceof Error ? error.message : "Unknown error occurred"}, trackingId: ${trackingId}`,
        title: "Signing Error",
        variant: "error",
      });
      resetButtonState();
    }
  };

  const checkSwapStatus = async (
    trackingId: string,
    tradeId: string,
    maxAttempts = 10,
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      if (!trackingId || !tradeId) return;
      const response = await client.dexGateway.checkTradeStatus({
        tracking_id: trackingId,
        trade_id: tradeId,
      });

      dismissToast();

      if (
        response.status === TradeStatus.SETTLED ||
        response.status === TradeStatus.SLASHED
      ) {
        resetButtonState();
        toast({
          description: `SWAPPED ${form.state.values.sellAmount} ${sellTokenAddress} FOR ${form.state.values.buyAmount} ${buyTokenAddress}. protected from MEV attacks.`,
          title: "Swap complete",
          variant: "success",
        });
        refetchBuyTokenAccount();
        refetchSellTokenAccount();
        return;
      }

      if (
        response.status === TradeStatus.CANCELLED ||
        response.status === TradeStatus.FAILED
      ) {
        resetButtonState();
        toast({
          description: `Trade ${response.status}!, trackingId: ${trackingId}`,
          title: `Trade ${response.status}`,
          variant: "error",
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

  const handleSwap = async () => {
    if (!publicKey) {
      toast({
        description: "Missing wallet address or token information",
        title: "Swap Error",
        variant: "error",
      });
      return;
    }

    toast({
      description:
        "Hiding your slippage tolerance from mev bot until verification. this may take a few seconds.",
      title: "Generating zero-knowledge proof [1/3]",
      variant: "loading",
    });
    setSwapStep(1);
    setIsLoadingSwapButton(true);

    try {
      const formState = form.state.values;
      const sellAmount = Number(formState.sellAmount.replace(/,/g, ""));
      const buyAmount = Number(formState.buyAmount.replace(/,/g, ""));

      if (!buyTokenAddress || !sellTokenAddress) {
        throw new Error("Missing token addresses");
      }

      const sortedTokens = sortSolanaAddresses(
        buyTokenAddress,
        sellTokenAddress,
      );

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      const response = await client.dexGateway.getSwap({
        amount_in: Number(sellAmount),
        is_swap_x_to_y: isXtoY,
        min_out: isUseSlippage
          ? BigNumber(buyAmount)
              .multipliedBy(1 - Number(slippage) / 100)
              .toNumber()
          : Number(buyAmount),
        network: parseInt(process.env.NETWORK || "2", 10),
        token_mint_x: tokenXAddress,
        token_mint_y: tokenYAddress,
        tracking_id: "123", // should place this in the orpc and better structure for tracking
        user_address: publicKey.toBase58(),
      });

      if (response.success && response.unsignedTransaction) {
        requestSigning(
          response.unsignedTransaction,
          response.tradeId,
          response.trackingId,
        );
      } else {
        // throw new Error("Failed to create swap transaction");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast({
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        title: "Swap Error",
        variant: "error",
      });
      resetButtonState();
    }
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
    const amountInNumber = Number(amountIn.replace(/,/g, ""));
    if (!poolDetails || BigNumber(amountInNumber).lte(0)) return;

    setIsLoadingQuote(true);
    setIsDisableSwapButton(true);
    const quote = await client.getSwapQuote({
      amountIn: amountInNumber,
      isXtoY,
      slippage,
      tokenXMint: poolDetails.tokenXMint,
      tokenYMint: poolDetails.tokenYMint,
    });
    setQuote(quote);
    if (type === "sell") {
      form.setFieldValue("buyAmount", String(quote.amountOut));
    } else {
      form.setFieldValue("sellAmount", String(quote.amountOut));
    }
    setIsDisableSwapButton(false);
    setIsLoadingQuote(false);
  };

  const debouncedGetQuote = useDebouncedCallback(getQuote, 500);

  const checkInsufficientBalance = (input: string) => {
    const value = input.replace(/,/g, "");
    const accountAmount = sellTokenAccount?.tokenAccounts[0]?.amount || 0;
    const decimal = sellTokenAccount?.tokenAccounts[0]?.decimals || 0;

    if (BigNumber(value).gt(convertToDecimal(accountAmount, decimal))) {
      setIsInsufficientBalance(true);
      return;
    }

    setIsInsufficientBalance(false);
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = e.target.value.replace(/,/g, "");

    if (type === "sell") {
      checkInsufficientBalance(value);
    }

    if (BigNumber(value).gt(0)) {
      debouncedGetQuote({
        amountIn: value,
        isXtoY,
        slippage: parseFloat(slippage),
        type,
      });
    } else {
      setIsDisableSwapButton(true);
    }
  };

  const onClickSwapToken = () => {
    const sellAmount = Number(form.state.values.sellAmount.replace(/,/g, ""));
    checkInsufficientBalance(String(sellAmount));
    if (!poolDetails || BigNumber(sellAmount).lte(0)) return;

    debouncedGetQuote({
      amountIn: form.state.values.sellAmount,
      isXtoY: !isXtoY,
      slippage: parseFloat(slippage),
      type: "sell",
    });
  };

  const getButtonMessage = () => {
    const message = BUTTON_MESSAGE.SWAP;

    if (swapStep === 1) {
      return BUTTON_MESSAGE.STEP_1;
    }

    if (swapStep === 2) {
      return BUTTON_MESSAGE.STEP_2;
    }

    if (swapStep === 3) {
      return BUTTON_MESSAGE.STEP_3;
    }

    if (isLoadingQuote) {
      return BUTTON_MESSAGE.LOADING;
    }

    if (form.state.values.sellAmount) {
      const inputClean = form.state.values.sellAmount.replace(/,/g, "");
      if (BigNumber(inputClean).lte(0)) {
        return BUTTON_MESSAGE.ENTER_AMOUNT;
      }

      const accountAmount = sellTokenAccount?.tokenAccounts[0]?.amount || 0;
      const decimal = sellTokenAccount?.tokenAccounts[0]?.decimals || 0;
      const symbol = sellTokenAccount?.tokenAccounts[0]?.symbol || "";

      if (BigNumber(inputClean).gt(convertToDecimal(accountAmount, decimal))) {
        return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
      }
    }

    if (quote) {
      const slippageImpact = quote.priceImpactPercentage;
      if (slippageImpact > 0.5) {
        return BUTTON_MESSAGE.HIGH_PRICE_IMPACT.replace(
          "{value}",
          slippageImpact.toString(),
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
              setIsUseSlippage(slippage !== "0");
              setSlippage(slippage);
              debouncedGetQuote({
                amountIn: form.state.values.sellAmount,
                isXtoY,
                slippage: parseFloat(slippage),
                type: "sell",
              });
            }}
          />
          <SwapPageRefreshButton
            onClick={() => {
              debouncedGetQuote({
                amountIn: form.state.values.sellAmount,
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
                <SelectTokenButton type="sell" />
              </div>
              <form.Field name="sellAmount">
                {(field) => (
                  <FormFieldset
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
              <form.Field name="buyAmount">
                {(field) => (
                  <FormFieldset
                    disabled={true}
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
                    isDisableSwap ||
                    isInsufficientBalance ||
                    isLoadingQuote ||
                    isLoadingSwapButton
                  }
                  loading={isLoadingSwapButton || isLoadingQuote}
                  onClick={handleSwap}
                >
                  {getButtonMessage()}
                </Button>
              ) : (
                <Button className="w-full cursor-pointer py-3" disabled={true}>
                  Create Pool
                </Button>
              )}
            </div>
          </div>
          {quote && (
            <TokenTransactionDetails
              quote={quote}
              slippage={slippage}
              tokenBuyMint={buyTokenAddress}
              tokenSellMint={sellTokenAddress}
            />
          )}
        </Box>
        <div className="hidden flex-col gap-1 md:flex">
          <TokenTransactionSettingsButton
            onChange={(slippage) => {
              setIsUseSlippage(slippage !== "0");
              setSlippage(slippage);
              debouncedGetQuote({
                amountIn: form.state.values.sellAmount,
                isXtoY,
                slippage: parseFloat(slippage),
                type: "sell",
              });
            }}
          />
          <SwapPageRefreshButton
            onClick={() => {
              debouncedGetQuote({
                amountIn: form.state.values.sellAmount,
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
