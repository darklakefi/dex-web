"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import type { AddLiquidityTxInput } from "@dex-web/orpc/schemas";
import { Box, Button, Text } from "@dex-web/ui";
import { convertToDecimal } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
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
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { sortSolanaAddresses } from "../../../_utils/sortSolanaAddresses";
import { dismissToast, toast } from "../../../_utils/toast";

export const { fieldContext, formContext } = createFormHookContexts();

const liquidityFormSchema = z.object({
  tokenAAmount: z.string(),
  tokenBAmount: z.string(),
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
    tokenAAmount: "0",
    tokenBAmount: "0",
  } satisfies LiquidityFormSchema,
  onSubmit: async ({
    value,
  }: {
    value: { tokenAAmount: string; tokenBAmount: string };
  }) => {
    console.log(value);
  },
  validators: {
    onChange: liquidityFormSchema,
  },
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
  const { publicKey, wallet, signTransaction } = useWallet();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
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
        tokenXMint: tokenBAddress ?? DEFAULT_SELL_TOKEN,
        tokenYMint: tokenAAddress ?? DEFAULT_BUY_TOKEN,
      },
    }),
  );

  const { data: buyTokenAccount, refetch: refetchBuyTokenAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenAAddress || DEFAULT_BUY_TOKEN,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      }),
    );

  const { data: sellTokenAccount, refetch: refetchSellTokenAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenBAddress || DEFAULT_SELL_TOKEN,
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
      const transaction = VersionedTransaction.deserialize(
        unsignedTransactionBuffer,
      );

      const signedTransaction = await signTransaction(transaction);
      const signedTransactionBase64 = Buffer.from(
        signedTransaction.serialize(),
      ).toString("base64");

      setTrackDetails({
        trackingId,
        tradeId,
      });
      const signedTxRequest = {
        signed_transaction: signedTransactionBase64,
        tracking_id: trackingId,
      };

      setLiquidityStep(3);
      toast({
        description: "Submitting liquidity transaction to Solana network.",
        title: "Confirming transaction [3/3]",
        variant: "loading",
      });

      const liquidityTxResponse =
        await client.dexGateway.submitLiquidityTx(signedTxRequest);

      if (liquidityTxResponse.success && liquidityTxResponse.signature) {
        checkLiquidityTransactionStatus(
          liquidityTxResponse.signature,
          trackingId,
        );
      } else {
        const errorMessage =
          liquidityTxResponse.error_logs || "Unknown error occurred";
        console.error("Liquidity transaction submission failed:", {
          error_logs: liquidityTxResponse.error_logs,
          success: liquidityTxResponse.success,
          tracking_id: liquidityTxResponse.tracking_id,
        });
        throw new Error(`Liquidity transaction failed: ${errorMessage}`);
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

  const checkLiquidityTransactionStatus = async (
    signature: string,
    trackingId: string,
    maxAttempts = 15,
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await client.dexGateway.checkLiquidityTxStatus({
          signature,
          tracking_id: trackingId,
        });

        if (response.status === "finalized") {
          if (response.error) {
            // Transaction failed
            dismissToast();
            setLiquidityStep(0);
            toast({
              description: `Transaction failed: ${response.error}, trackingId: ${trackingId}`,
              title: "Liquidity Transaction Failed",
              variant: "error",
            });
            return;
          } else {
            // Transaction succeeded
            dismissToast();
            setLiquidityStep(0);
            toast({
              description: `ADDED LIQUIDITY: ${form.state.values.tokenAAmount} ${tokenBAddress} + ${form.state.values.tokenBAmount} ${tokenAAddress}. Transaction: ${signature}`,
              title: "Liquidity Added Successfully",
              variant: "success",
            });
            refetchBuyTokenAccount();
            refetchSellTokenAccount();
            return;
          }
        }

        if (response.status === "failed") {
          // Transaction failed
          dismissToast();
          setLiquidityStep(0);
          toast({
            description: `Transaction failed: ${response.error || "Unknown error"}, trackingId: ${trackingId}`,
            title: "Liquidity Transaction Failed",
            variant: "error",
          });
          return;
        }

        // Still processing (pending or confirmed)
        toast({
          description: `Finalizing transaction... (${i + 1}/${maxAttempts}) - ${response.status}, trackingId: ${trackingId}`,
          title: "Confirming liquidity transaction",
          variant: "loading",
        });

        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error("Error checking transaction status:", error);
        if (i === maxAttempts - 1) {
          dismissToast();
          setLiquidityStep(0);
          toast({
            description: `Unable to confirm transaction status. Check your wallet or explorer with signature: ${signature}`,
            title: "Transaction Status Unknown",
            variant: "error",
          });
        }
      }
    }

    // Timeout
    dismissToast();
    setLiquidityStep(0);
    toast({
      description: `Transaction may still be processing. Check explorer with signature: ${signature}`,
      title: "Transaction Status Timeout",
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
      const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
      const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

      const sortedTokens = sortSolanaAddresses(
        finalTokenAAddress,
        finalTokenBAddress,
      );

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      if (!wallet) {
        throw new Error("Missing wallet");
      }

      if (!tokenXAddress || !tokenYAddress) {
        throw new Error("Invalid token addresses after sorting");
      }

      const sellAmount = Number(
        form.state.values.tokenBAmount.replace(/,/g, ""),
      );
      const buyAmount = Number(
        form.state.values.tokenAAmount.replace(/,/g, ""),
      );

      const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      // Scale amounts to proper token units (assuming 6 decimals for now)
      const scaledAmountX = Math.floor(maxAmountX * 1e6);
      const scaledAmountY = Math.floor(maxAmountY * 1e6);

      // Use a more conservative LP token estimate to avoid slippage issues
      // Instead of applying slippage to LP tokens, let the contract calculate them
      const estimatedLpTokens = Math.sqrt(scaledAmountX * scaledAmountY);
      const minLpTokens = Math.floor(estimatedLpTokens * 0.95); // 5% buffer for LP calculation

      const requestPayload = {
        lpTokensToMint: minLpTokens,
        maxAmountX: scaledAmountX,
        maxAmountY: scaledAmountY,
        tokenXMint: tokenXAddress,
        tokenXProgramId: poolDetails?.tokenXMint ?? "",
        tokenYMint: tokenYAddress,
        tokenYProgramId: poolDetails?.tokenYMint ?? "",
        trackingId: "",
        user: publicKey.toBase58(),
      } satisfies AddLiquidityTxInput;

      const response = await client.dexGateway.addLiquidity(requestPayload);

      if (response.success && response.transaction && response.tradeId) {
        requestSigning(
          response.transaction,
          response.tradeId,
          response.trackingId,
        );
      } else {
        throw new Error("Failed to create liquidity transaction");
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

    if (inputType === "tokenX") {
      const requiredTokenY = amountNumber * poolRatio;
      form.setFieldValue("tokenAAmount", String(requiredTokenY));
    } else {
      const requiredTokenX = amountNumber / poolRatio;
      form.setFieldValue("tokenBAmount", String(requiredTokenX));
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

    const hasInsufficientBalance = checkInsufficientBalance(value, type);

    if (BigNumber(value).gt(0) && !hasInsufficientBalance) {
      const inputType =
        (type === "sell" && poolDetails?.tokenXMint === tokenBAddress) ||
        (type === "buy" && poolDetails?.tokenXMint === tokenAAddress)
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
    const sellAmount = form.state.values.tokenBAmount.replace(/,/g, "");
    const buyAmount = form.state.values.tokenAAmount.replace(/,/g, "");

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

    if (
      !sellAmount ||
      BigNumber(sellAmount).lte(0) ||
      !buyAmount ||
      BigNumber(buyAmount).lte(0)
    ) {
      return BUTTON_MESSAGE.ENTER_AMOUNT;
    }

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
    const sellAmount = Number(form.state.values.tokenBAmount.replace(/,/g, ""));
    const buyAmount = Number(form.state.values.tokenAAmount.replace(/,/g, ""));

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
            <form.Field name="tokenBAmount">
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
            <form.Field name="tokenAAmount">
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
              <Button
                className="w-full cursor-pointer py-3"
                disabled={true}
                loading={false}
              >
                Add Liquidity
              </Button>
            )}
          </div>
        </div>
        {poolDetails &&
          form.state.values.tokenBAmount !== "0" &&
          form.state.values.tokenAAmount !== "0" && (
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
                    {form.state.values.tokenBAmount}{" "}
                    {sellTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                  <Text.Body3 className="text-white">
                    {form.state.values.tokenAAmount}{" "}
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
                    Number(form.state.values.tokenBAmount) *
                      Number(form.state.values.tokenAAmount),
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
            if (form.state.values.tokenBAmount !== "0") {
              const inputType =
                poolDetails?.tokenXMint === tokenBAddress ? "tokenX" : "tokenY";
              debouncedCalculateTokenAmounts({
                inputAmount: form.state.values.tokenBAmount,
                inputType,
              });
            }
          }}
        />
      </div>
    </section>
  );
}
