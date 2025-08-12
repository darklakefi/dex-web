"use client";

import { client, TradeStatus, tanstackClient } from "@dex-web/orpc";
import type { AddLiquidityTxInput } from "@dex-web/orpc/schemas";
import { Box, Button, Text } from "@dex-web/ui";
import { convertToDecimal } from "@dex-web/utils";
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
  1: "protecting liquidity transaction [1/3]",
  2: "confirm liquidity in your wallet [2/3]",
  3: "verifying liquidity transaction [3/3]",
  10: "calculating amounts...",
};

const BUTTON_MESSAGE = {
  ADD_LIQUIDITY: "Add Liquidity",
  CALCULATING: "calculating amounts...",
  ENTER_AMOUNT: "enter an amount",
  INSUFFICIENT_BALANCE: "insufficient",
  LOADING: "loading",
  STEP_1: "protecting liquidity transaction [1/3]",
  STEP_2: "confirm liquidity in your wallet [2/3]",
  STEP_3: "verifying liquidity transaction [3/3]",
};

export function LiquidityForm() {
  const form = useAppForm(formConfig);
  const { publicKey, wallet, signTransaction, signAllTransactions } =
    useWallet();
  const { connection } = useConnection();
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const [liquidityStep, setLiquidityStep] = useState(0);
  const [disableLiquidity, setDisableLiquidity] = useState(true);
  const [_trackDetails, setTrackDetails] = useState<{
    tradeId: string;
    trackingId: string;
  }>({
    trackingId: "",
    tradeId: "",
  });
  const [slippage, setSlippage] = useState("0.5");
  const [isInsufficientBalanceSell, setIsInsufficientBalanceSell] =
    useState(false);
  const [isInsufficientBalanceBuy, setIsInsufficientBalanceBuy] =
    useState(false);

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

  // Pool ratio calculation for liquidity provision - using 1:1 ratio as default
  // TODO: Get actual pool reserves from API to calculate proper ratio
  const poolRatio = 1;

  const checkInsufficientBalance = (input: string, type: "sell" | "buy") => {
    const value = input.replace(/,/g, "");
    const tokenAccount = type === "sell" ? sellTokenAccount : buyTokenAccount;
    const accountAmount = tokenAccount?.tokenAccounts[0]?.amount || 0;
    const decimal = tokenAccount?.tokenAccounts[0]?.decimals || 0;

    if (BigNumber(value).gt(convertToDecimal(accountAmount, decimal))) {
      if (type === "sell") {
        setIsInsufficientBalanceSell(true);
      } else {
        setIsInsufficientBalanceBuy(true);
      }
      return true;
    }

    if (type === "sell") {
      setIsInsufficientBalanceSell(false);
    } else {
      setIsInsufficientBalanceBuy(false);
    }
    return false;
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

      setLiquidityStep(2);
      toast({
        description:
          "Tokens will be secured until slippage verification completes.",
        title: "Confirm liquidity [2/3]",
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
          "Checking if liquidity transaction stayed within your slippage tolerance before finalizing.",
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
          description: `ADDED LIQUIDITY: ${form.state.values.sellAmount} ${sellTokenAddress} + ${form.state.values.buyAmount} ${buyTokenAddress}. Protected from MEV attacks.`,
          title: "Liquidity Added Successfully",
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
        title: "Liquidity Error",
        variant: "error",
      });
      return;
    }

    toast({
      description:
        "Hiding your slippage tolerance from MEV bots until verification. This may take a few seconds.",
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

      const sellAmount = Number(form.state.values.sellAmount.replace(/,/g, ""));
      const buyAmount = Number(form.state.values.buyAmount.replace(/,/g, ""));

      // Determine which token is X and which is Y
      const isTokenXSell = poolDetails?.tokenXMint === sellTokenAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      // Calculate minimum LP tokens to receive (with slippage protection)
      const slippageMultiplier = (100 - parseFloat(slippage)) / 100;
      const estimatedLpTokens = Math.sqrt(maxAmountX * maxAmountY); // Geometric mean approximation
      const minLpTokens = estimatedLpTokens * slippageMultiplier;

      const response = await client.dexGateway.addLiquidity({
        lpTokensToMint: Math.floor(minLpTokens),
        maxAmountX: Math.floor(maxAmountX),
        maxAmountY: Math.floor(maxAmountY),
        tokenXMint: tokenXAddress,
        tokenXProgramId: poolDetails?.tokenXMint ?? "",
        tokenYMint: tokenYAddress,
        tokenYProgramId: poolDetails?.tokenYMint ?? "",
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

  const calculateTokenAmounts = ({
    inputAmount,
    inputType,
  }: {
    inputAmount: string;
    inputType: "tokenX" | "tokenY";
  }) => {
    const amountNumber = Number(inputAmount.replace(/,/g, ""));
    if (!poolDetails || BigNumber(amountNumber).lte(0) || !poolRatio) return;

    setLiquidityStep(10);
    setDisableLiquidity(true);

    // Calculate the required amount of the other token based on pool ratio
    if (inputType === "tokenX") {
      // If user inputs tokenX (sell token), calculate required tokenY (buy token)
      const requiredTokenY = amountNumber * poolRatio;
      form.setFieldValue("buyAmount", String(requiredTokenY));
    } else {
      // If user inputs tokenY (buy token), calculate required tokenX (sell token)
      const requiredTokenX = amountNumber / poolRatio;
      form.setFieldValue("sellAmount", String(requiredTokenX));
    }

    setDisableLiquidity(false);
    setLiquidityStep(0);
  };

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    500,
  );

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = e.target.value.replace(/,/g, "");

    // Check insufficient balance
    const hasInsufficientBalance = checkInsufficientBalance(value, type);

    if (BigNumber(value).gt(0) && !hasInsufficientBalance) {
      // Determine if this is tokenX or tokenY based on the token addresses
      const inputType =
        (type === "sell" && poolDetails?.tokenXMint === sellTokenAddress) ||
        (type === "buy" && poolDetails?.tokenXMint === buyTokenAddress)
          ? "tokenX"
          : "tokenY";

      debouncedCalculateTokenAmounts({
        inputAmount: value,
        inputType,
      });
    } else {
      setDisableLiquidity(true);
    }
  };

  const getButtonMessage = () => {
    const sellAmount = form.state.values.sellAmount.replace(/,/g, "");
    const buyAmount = form.state.values.buyAmount.replace(/,/g, "");

    if (liquidityStep === 1) {
      return BUTTON_MESSAGE.STEP_1;
    }

    if (liquidityStep === 2) {
      return BUTTON_MESSAGE.STEP_2;
    }

    if (liquidityStep === 3) {
      return BUTTON_MESSAGE.STEP_3;
    }

    if (liquidityStep === 10) {
      return BUTTON_MESSAGE.CALCULATING;
    }

    // Check if amounts are entered
    if (
      !sellAmount ||
      BigNumber(sellAmount).lte(0) ||
      !buyAmount ||
      BigNumber(buyAmount).lte(0)
    ) {
      return BUTTON_MESSAGE.ENTER_AMOUNT;
    }

    // Check insufficient balance for sell token
    if (isInsufficientBalanceSell) {
      const symbol = sellTokenAccount?.tokenAccounts[0]?.symbol || "";
      return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
    }

    if (isInsufficientBalanceBuy) {
      const symbol = buyTokenAccount?.tokenAccounts[0]?.symbol || "";
      return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
    }

    return BUTTON_MESSAGE.ADD_LIQUIDITY;
  };

  const onClickDeposit = () => {
    const sellAmount = Number(form.state.values.sellAmount.replace(/,/g, ""));
    const buyAmount = Number(form.state.values.buyAmount.replace(/,/g, ""));

    if (
      !poolDetails ||
      BigNumber(sellAmount).lte(0) ||
      BigNumber(buyAmount).lte(0)
    ) {
      setDisableLiquidity(true);
      return;
    }

    setDisableLiquidity(false);
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
                Token A Amount
              </Text.Body2>
              <SelectTokenButton returnUrl="liquidity" type="sell" />
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
                Token B Amount
              </Text.Body2>
              <SelectTokenButton returnUrl="liquidity" type="buy" />
            </div>
            <form.Field name="buyAmount">
              {(field) => (
                <FormFieldset
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
                disabled={
                  liquidityStep !== 0 ||
                  disableLiquidity ||
                  isInsufficientBalanceSell ||
                  isInsufficientBalanceBuy
                }
                loading={liquidityStep !== 0}
                onClick={handleDeposit}
              >
                {getButtonMessage()}
              </Button>
            ) : (
              <Button className="w-full cursor-pointer py-3" disabled={true}>
                Add Liquidity
              </Button>
            )}
          </div>
        </div>
        {poolDetails &&
          form.state.values.sellAmount !== "0" &&
          form.state.values.buyAmount !== "0" && (
            <div className="mt-4 space-y-3 border-green-600 border-t pt-4">
              <Text.Body2 className="mb-3 text-green-300 uppercase">
                Liquidity Details
              </Text.Body2>

              {/* Total Deposit */}
              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Total Deposit
                </Text.Body3>
                <div className="text-right">
                  <Text.Body3 className="text-white">
                    {form.state.values.sellAmount}{" "}
                    {sellTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                  <Text.Body3 className="text-white">
                    {form.state.values.buyAmount}{" "}
                    {buyTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                </div>
              </div>

              {/* Pool Price */}
              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">Pool Price</Text.Body3>
                <Text.Body3 className="text-white">
                  1 {sellTokenAccount?.tokenAccounts[0]?.symbol} ={" "}
                  {poolRatio.toFixed(6)}{" "}
                  {buyTokenAccount?.tokenAccounts[0]?.symbol}
                </Text.Body3>
              </div>

              {/* LP Tokens Received */}
              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">LP Tokens</Text.Body3>
                <Text.Body3 className="text-white">
                  ~
                  {Math.sqrt(
                    Number(form.state.values.sellAmount) *
                      Number(form.state.values.buyAmount),
                  ).toFixed(6)}
                </Text.Body3>
              </div>

              {/* Pool Share */}
              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">Pool Share</Text.Body3>
                <Text.Body3 className="text-white">
                  ~0.01%{" "}
                  {/* This would be calculated based on total pool liquidity */}
                </Text.Body3>
              </div>

              {/* Estimated Fees */}
              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Est. Fee (24h)
                </Text.Body3>
                <Text.Body3 className="text-green-400">
                  $0.24{" "}
                  {/* This would be calculated based on pool volume and fees */}
                </Text.Body3>
              </div>

              {/* Slippage Tolerance */}
              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Slippage Tolerance
                </Text.Body3>
                <Text.Body3 className="text-white">{slippage}%</Text.Body3>
              </div>
            </div>
          )}
      </Box>
      <div className="flex flex-col gap-1">
        <TokenTransactionSettingsButton
          onChange={(slippage) => {
            setSlippage(slippage);
            // Recalculate with new slippage if amounts are present
            if (form.state.values.sellAmount !== "0") {
              const inputType =
                poolDetails?.tokenXMint === sellTokenAddress
                  ? "tokenX"
                  : "tokenY";
              debouncedCalculateTokenAmounts({
                inputAmount: form.state.values.sellAmount,
                inputType,
              });
            }
          }}
        />
      </div>
    </section>
  );
}
