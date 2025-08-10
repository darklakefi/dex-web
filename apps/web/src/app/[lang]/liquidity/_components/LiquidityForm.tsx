"use client";

import { AnchorProvider } from "@coral-xyz/anchor";
import { client, TradeStatus, tanstackClient } from "@dex-web/orpc";
import type {
  AddLiquidityTxInput,
  GetQuoteOutput,
} from "@dex-web/orpc/schemas";
import { Box, Button, Text } from "@dex-web/ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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

export const { fieldContext, formContext } = createFormHookContexts();

const liquidityFormSchema = z.object({
  buyAmount: z.string(),
  sellAmount: z.string(),
});

type LiquidityFormSchema = z.infer<typeof liquidityFormSchema>;

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
  } satisfies LiquidityFormSchema,
  onSubmit: async ({
    value,
  }: {
    value: { buyAmount: string; sellAmount: string };
  }) => {
    console.log(value);
  },
  validators: {
    onChange: liquidityFormSchema,
  },
};

const MESSAGE_STEP = {
  1: "protecting trade [1/3]",
  2: "confirm trade in your wallet[2/3]",
  3: "verifying trade [3/3]",
  10: "loading quote...",
};

export function LiquidityForm() {
  const form = useAppForm(formConfig);
  const { publicKey, wallet, signTransaction, signAllTransactions } =
    useWallet();
  const { connection } = useConnection();
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const [swapStep, setLiquidityStep] = useState(0);
  const [disableSwap, setDisableSwap] = useState(true);
  const [_trackDetails, setTrackDetails] = useState<{
    tradeId: string;
    trackingId: string;
  }>({
    trackingId: "",
    tradeId: "",
  });
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

  const requestSigning = async (
    unsignedTransaction: string,
    tradeId: string,
    trackingId: string,
  ) => {
    try {
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signTransaction)
        throw new Error("Wallet does not support transaction signing!");

      setLiquidityStep(2);
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

      setLiquidityStep(3);
      toast({
        description:
          "Checking if swap stayed within your hidden slippage tolerance before finalizing trade.",
        title: "Verify slippage requirements [3/3]",
        variant: "loading",
      });

      const signedTxResponse =
        await client.dexGateway.submitSignedTransaction(signedTxRequest);

      if (signedTxResponse.success) {
        checkLiquidityStatus(trackingId, tradeId);
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
      setLiquidityStep(0);
    }
  };

  const checkLiquidityStatus = async (
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
        setLiquidityStep(0);
        toast({
          description: `DEPOSITED ${form.state.values.sellAmount} ${sellTokenAddress} FOR ${form.state.values.buyAmount} ${buyTokenAddress}. protected from MEV attacks.`,
          title: "Deposit complete",
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
        setLiquidityStep(0);
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

  const handleDeposit = async () => {
    if (!publicKey) {
      toast({
        description: "Missing wallet address or token information",
        title: "Deposit Error",
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
    setLiquidityStep(1);

    try {
      if (!buyTokenAddress || !sellTokenAddress) {
        throw new Error("Missing token addresses");
      }

      const sortedTokens = sortSolanaAddresses(
        buyTokenAddress,
        sellTokenAddress,
      );

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      if (!wallet) {
        throw new Error("Missing wallet");
      }

      const hasSigner =
        publicKey &&
        typeof signTransaction === "function" &&
        typeof signAllTransactions === "function";

      const anchorWallet = hasSigner
        ? ({
            publicKey,
            signAllTransactions,
            signTransaction,
          } as const)
        : null;

      if (!anchorWallet) {
        throw new Error("Missing wallet");
      }

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
        skipPreflight: true,
      });

      const response = await client.dexGateway.addLiquidity({
        lpTokensToMint: 0,
        maxAmountX: 0,
        maxAmountY: 0,
        provider,
        tokenXMint: tokenXAddress,
        tokenXProgramId: buyTokenAddress,
        tokenYMint: tokenYAddress,
        tokenYProgramId: sellTokenAddress,
        trackingId: "",
        user: publicKey.toBase58(),
      } satisfies AddLiquidityTxInput);

      if (response.success && response.transaction) {
        requestSigning(
          response.transaction.serialize().toString("base64"),
          response.transaction.signature?.toString() ?? "",
          response.trackingId,
        );
      } else {
        // throw new Error("Failed to create swap transaction");
      }
    } catch (error) {
      console.error("Liquidity error:", error);
      toast({
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        title: "Liquidity Error",
        variant: "error",
      });
      setLiquidityStep(0);
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

    setLiquidityStep(10);
    setDisableSwap(true);
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
    setDisableSwap(false);
    setLiquidityStep(0);
  };

  const debouncedGetQuote = useDebouncedCallback(getQuote, 500);

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = e.target.value.replace(/,/g, "");
    if (BigNumber(value).gt(0)) {
      debouncedGetQuote({
        amountIn: value,
        isXtoY,
        slippage: parseFloat(slippage),
        type,
      });
    } else {
      setDisableSwap(true);
    }
  };

  const onClickDeposit = () => {
    const sellAmount = Number(form.state.values.sellAmount.replace(/,/g, ""));
    if (!poolDetails || BigNumber(sellAmount).lte(0)) return;

    debouncedGetQuote({
      amountIn: form.state.values.sellAmount,
      isXtoY: !isXtoY,
      slippage: parseFloat(slippage),
      type: "sell",
    });
  };

  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />
      <Box padding="lg">
        <div className="flex flex-col gap-4">
          <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
            <div>
              <Text.Body2
                as="label"
                className="mb-3 block text-green-300 uppercase"
              >
                Token
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
            <TokenTransactionButton onClickTokenTransaction={onClickDeposit} />
          </div>
          <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
            <div>
              <Text.Body2
                as="label"
                className="mb-3 block text-green-300 uppercase"
              >
                Token
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
                className="w-full cursor-pointer py-3"
                disabled={swapStep !== 0 || disableSwap}
                loading={swapStep !== 0}
                onClick={handleDeposit}
              >
                {swapStep === 0
                  ? "Deposit"
                  : MESSAGE_STEP[swapStep as keyof typeof MESSAGE_STEP]}
              </Button>
            ) : (
              <Button className="w-full cursor-pointer py-3" disabled={true}>
                Deposit
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
      <div className="flex flex-col gap-1">
        <TokenTransactionSettingsButton
          onChange={(slippage) => {
            setSlippage(slippage);
            debouncedGetQuote({
              amountIn: form.state.values.sellAmount,
              isXtoY,
              slippage: parseFloat(slippage),
              type: "sell",
            });
          }}
        />
        {/* <SwapPageRefreshButton
          onClick={() => {
            debouncedGetQuote({
              amountIn: form.state.values.sellAmount,
              isXtoY,
              slippage: parseFloat(slippage),
              type: "sell",
            });
          }}
        /> */}
      </div>
    </section>
  );
}
