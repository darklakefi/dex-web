"use client";

import { client } from "@dex-web/orpc";
import { Box, Button, Text } from "@dex-web/ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { toast } from "../../../_utils/toast";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapButton } from "./SwapButton";
import { SwapFormFieldset } from "./SwapFormFieldset";

export const { fieldContext, formContext } = createFormHookContexts();

const swapFormSchema = z.object({
  buyAmount: z.number().nonnegative(),
  sellAmount: z.number().nonnegative(),
});

type SwapFormSchema = z.infer<typeof swapFormSchema>;

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset,
  },

  fieldContext,
  formComponents: {},
  formContext,
});

const formConfig = {
  defaultValues: {
    buyAmount: 0,
    sellAmount: 0,
  } satisfies SwapFormSchema,
  onSubmit: async ({
    value,
  }: {
    value: { buyAmount: number; sellAmount: number };
  }) => {
    console.log(value);
  },
  validators: {
    onChange: swapFormSchema,
  },
};

const MESSAGE_STEP = {
  1: "protecting trade [1/3]",
  2: "confirm trade in your wallet[2/3]",
  3: "verifying trade [3/3]",
};

export function SwapForm() {
  const form = useAppForm(formConfig);
  const { wallets, signTransaction, publicKey } = useWallet();
  const searchParams = useSearchParams();
  const [swapStep, setSwapStep] = useState(0);

  // Get token information from search params
  const sellTokenMint = searchParams.get("sellToken") || "";
  const buyTokenMint = searchParams.get("buyToken") || "";

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
      const signedTxRequest = {
        signed_transaction: signedTransactionBase64,
        tracking_id: trackingId,
        trade_id: tradeId,
      };

      setSwapStep(3);
      toast({
        description:
          "Checking if swap stayed within your hidden slippage tolerance before finalizing trade.",
        title: "Verify slippage requirements [3/3]",
        variant: "loading",
      });

      const signedTxResponse =
        await client.dexGateway.submitSignedTransaction(signedTxRequest);

      if (signedTxResponse.success) {
        setSwapStep(0);
        toast({
          description: "Trade completed!",
          title: "Trade completed",
          variant: "success",
        });
      } else {
        throw new Error("Failed to submit signed transaction");
      }
    } catch (error) {
      console.error("Signing error:", error);
      toast({
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        title: "Signing Error",
        variant: "error",
      });
      setSwapStep(0);
    }
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

    try {
      const formState = form.state.values;
      const sellAmount = formState.sellAmount;
      const buyAmount = formState.buyAmount;
      const response = await client.dexGateway.getSwap({
        amount_in: sellAmount,
        is_swap_x_to_y: true,
        min_out: buyAmount,
        network: parseInt(process.env.NETWORK || "2", 10),
        token_mint_x: sellTokenMint, // Using buyAmount as min_out (might need adjustment based on slippage)
        token_mint_y: buyTokenMint,
        tracking_id: "123",
        user_address: publicKey.toBase58(), // should place this in the orpc and better structure for tracking
      });

      if (response.success && response.unsignedTransaction) {
        requestSigning(
          response.unsignedTransaction,
          response.tradeId,
          response.trackingId,
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
      setSwapStep(0);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Box background="highlight" className="flex-row">
        <div>
          <Text.Body2
            as="label"
            className="mb-6 block text-green-300 uppercase"
          >
            Selling
          </Text.Body2>
          <SelectTokenButton type="sell" />
        </div>
        <form.Field name="sellAmount">
          {(field) => (
            <SwapFormFieldset
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(Number(e.target.value))
              }
              value={field.state.value}
            />
          )}
        </form.Field>
      </Box>
      <div className="flex items-center justify-center">
        <SwapButton />
      </div>
      <Box background="highlight" className="flex-row">
        <div>
          <Text.Body2
            as="label"
            className="mb-6 block text-green-300 uppercase"
          >
            Buying
          </Text.Body2>
          <SelectTokenButton type="buy" />
        </div>
        <form.Field name="buyAmount">
          {(field) => (
            <SwapFormFieldset
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(Number(e.target.value))
              }
              value={field.state.value}
            />
          )}
        </form.Field>
      </Box>
      <div className="w-full">
        {!publicKey ? (
          <ConnectWalletButton className="w-full py-3" wallets={wallets} />
        ) : (
          <Button
            className="w-full cursor-pointer py-3"
            disabled={swapStep !== 0}
            loading={swapStep !== 0}
            onClick={handleSwap}
          >
            {swapStep === 0
              ? "Swap"
              : MESSAGE_STEP[swapStep as keyof typeof MESSAGE_STEP]}
          </Button>
        )}
      </div>
    </div>
  );
}
