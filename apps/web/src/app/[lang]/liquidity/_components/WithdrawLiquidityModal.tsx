"use client";

import {
  buildSubmittedToast,
  getUserFriendlyErrorMessage,
  isWarningMessage,
  signTransactionWithRecovery,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import type { GetTokenPriceOutput, Token } from "@dex-web/orpc/schemas/index";
import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import {
  calculateWithdrawalDetails,
  convertToDecimal,
  getExplorerUrl,
  getGatewayTokenAddress,
  InputType,
  numberFormatHelper,
  truncate,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import Decimal from "decimal.js";
import Link from "next/link";
import { useState } from "react";
import * as z from "zod";
import { useSubmitWithdrawal } from "../../../../hooks/mutations/useLiquidityMutations";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { dismissToast, toast } from "../../../_utils/toast";

type WithdrawLiquidityFormSchema = z.infer<typeof withdrawLiquidityFormSchema>;

const withdrawLiquidityFormSchema = z.object({
  withdrawalAmount: z.string().min(1, "Amount is required"),
});

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

interface WithdrawLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenXAddress: string;
  tokenYAddress: string;
  poolReserves?: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
    lpMint: string;
    exists: boolean;
  };
  userLiquidity?: {
    lpTokenBalance: number;
    lpTokenMint: string;
    decimals: number;
    hasLiquidity: boolean;
  };
  liquidityCalculations: {
    totalUsdValue: number;
    userLpShare: number;
    userTokenXAmount: number;
    userTokenYAmount: number;
  };
  tokenXDetails?: Token;
  tokenYDetails?: Token;
  /**
   * Token prices passed from parent to avoid suspense waterfall
   */
  tokenXPrice: GetTokenPriceOutput;
  tokenYPrice: GetTokenPriceOutput;
}

export function WithdrawLiquidityModal({
  isOpen,
  onClose,
  tokenXAddress,
  tokenYAddress,
  poolReserves,
  userLiquidity,
  liquidityCalculations,
  tokenXDetails,
  tokenYDetails,
  tokenXPrice,
  tokenYPrice,
}: WithdrawLiquidityModalProps) {
  const { publicKey, signTransaction, wallet } = useWallet();
  const submitWithdrawalMutation = useSubmitWithdrawal();
  const [withdrawalCalculations, setWithdrawalCalculations] = useState({
    percentage: 0,
    tokenXAmount: 0,
    tokenYAmount: 0,
    usdValue: 0,
  });

  const form = useAppForm({
    defaultValues: {
      withdrawalAmount: "",
    } satisfies WithdrawLiquidityFormSchema,
  });
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const tokenXSymbol = tokenXDetails?.symbol ?? truncate(tokenXAddress);
  const tokenYSymbol = tokenYDetails?.symbol ?? truncate(tokenYAddress);

  const setCalculationEmpty = () => {
    setWithdrawalCalculations({
      percentage: 0,
      tokenXAmount: 0,
      tokenYAmount: 0,
      usdValue: 0,
    });
  };

  const onWithdrawalAmountChange = (withdrawalAmountPercentage: string) => {
    if (
      !userLiquidity ||
      !poolReserves ||
      !withdrawalAmountPercentage ||
      withdrawalAmountPercentage.trim() === "" ||
      poolReserves.totalLpSupply === 0
    ) {
      setCalculationEmpty();
      return;
    }

    const details = calculateWithdrawalDetails({
      defaultBuyToken: DEFAULT_BUY_TOKEN,
      defaultSellToken: DEFAULT_SELL_TOKEN,
      inputType: InputType.Percentage,
      poolReserves,
      tokenAAddress: tokenXAddress,
      tokenAPrice: tokenXPrice ?? { price: 0 },
      tokenBAddress: tokenYAddress,
      tokenBPrice: tokenYPrice ?? { price: 0 },
      userLiquidity,
      withdrawalAmount: withdrawalAmountPercentage,
    });

    if (details.percentage <= 0) {
      return;
    }

    setWithdrawalCalculations({
      percentage: details.percentage,
      tokenXAmount: details.tokenAAmount,
      tokenYAmount: details.tokenBAmount,
      usdValue: details.usdValue,
    });
  };

  const handlePercentageClick = (percentage: number) => {
    form.setFieldValue("withdrawalAmount", percentage.toString());
    onWithdrawalAmountChange(percentage.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setFieldValue("withdrawalAmount", e.target.value);
    onWithdrawalAmountChange(e.target.value);
  };

  const resetWithdrawState = () => {
    setWithdrawStep(0);
    setIsWithdrawing(false);
  };

  const requestSigning = async (
    unsignedTransaction: string,
    opts: {
      minTokenXOut: string;
      minTokenYOut: string;
      tokenXOut: string;
      tokenYOut: string;
      tokenXMint: string;
      tokenYMint: string;
      lpTokenAmount: string;
    },
  ) => {
    try {
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signTransaction)
        throw new Error("Wallet does not support transaction signing!");

      setWithdrawStep(2);
      setIsWithdrawing(true);
      toast({
        description: "Please confirm the transaction in your wallet.",
        title: "Confirm withdrawal",
        variant: "loading",
      });

      const unsignedTransactionBuffer = Buffer.from(
        unsignedTransaction,
        "base64",
      );
      const transaction = Transaction.from(unsignedTransactionBuffer);

      const signedTransaction = await signTransactionWithRecovery(
        transaction,
        signTransaction,
      );

      setWithdrawStep(3);
      toast({
        description: "Submitting transaction to the blockchain...",
        title: "Processing withdrawal",
        variant: "loading",
      });

      const signedTransactionBase64 = Buffer.from(
        signedTransaction.serialize(),
      ).toString("base64");

      const submitRes = await submitWithdrawalMutation.mutateAsync({
        lpTokenAmount: opts.lpTokenAmount,
        minTokenXOut: opts.minTokenXOut,
        minTokenYOut: opts.minTokenYOut,
        ownerAddress: publicKey.toBase58(),
        signedTransaction: signedTransactionBase64,
        tokenXMint: opts.tokenXMint,
        tokenYMint: opts.tokenYMint,
      });

      if (!submitRes.success || !submitRes.signature) {
        throw new Error(submitRes.error || "Withdrawal submission failed");
      }

      dismissToast();
      const squads = isSquadsX(wallet);
      const isSubmitted = submitRes.status === "submitted";
      const submittedToast = buildSubmittedToast({
        description: submitRes.error
          ? `${submitRes.error} Transaction: ${submitRes.signature}`
          : undefined,
        signature: submitRes.signature,
        title: "Withdrawal submitted",
        transactionType: "LIQUIDITY",
      });
      toast({
        customAction: (
          <Text
            as={Link}
            className="inline-flex items-center gap-2 text-green-300 leading-none no-underline"
            href={getExplorerUrl({ tx: submitRes.signature })}
            target="_blank"
            variant="link"
          >
            View Transaction <Icon className="size-4" name="external-link" />
          </Text>
        ),
        description: (
          <div className="flex flex-col gap-1">
            <Text.Body2>
              {squads
                ? `Transaction initiated. You can now cast votes for this proposal on the Squads app.`
                : isSubmitted
                  ? submittedToast.description
                  : `Successfully withdrew ${opts.tokenYOut} ${tokenYSymbol} + ${opts.tokenXOut} ${tokenXSymbol}. Transaction: ${submitRes.signature}`}
            </Text.Body2>
          </div>
        ),

        title: squads
          ? "Proposal created"
          : isSubmitted
            ? submittedToast.title
            : "Withdrawal complete",
        variant: squads
          ? "success"
          : isSubmitted
            ? submittedToast.variant
            : "success",
      });

      form.reset();
      onClose();
      resetWithdrawState();
    } catch (error) {
      console.error("Signing error:", error);
      dismissToast();
      const squads = isSquadsX(wallet);

      const userMessage = getUserFriendlyErrorMessage(error);
      const isWarning = isWarningMessage(error);

      toast({
        description: squads
          ? `Transaction failed in Squads. Please review the proposal in the Squads app.`
          : userMessage,
        title: squads
          ? "Proposal failed"
          : isWarning
            ? "Transaction Warning"
            : "Transaction Error",
        variant: squads ? "error" : isWarning ? "warning" : "error",
      });
      resetWithdrawState();
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !userLiquidity || !poolReserves) {
      toast({
        description: "Missing wallet address or token information",
        title: "Withdrawal Error",
        variant: "error",
      });
      return;
    }

    if (isWithdrawing) return;

    toast({
      description: "Building withdrawal transaction...",
      title: "Preparing withdrawal",
      variant: "loading",
    });
    setWithdrawStep(1);
    setIsWithdrawing(true);

    try {
      const userLpBalanceDecimal = new Decimal(
        convertToDecimal(
          userLiquidity.lpTokenBalance || 0,
          userLiquidity.decimals,
        ).toString(),
      );

      const withdrawalDetails = calculateWithdrawalDetails({
        defaultBuyToken: DEFAULT_BUY_TOKEN,
        defaultSellToken: DEFAULT_SELL_TOKEN,
        inputType: InputType.Percentage,
        poolReserves,
        tokenAAddress: tokenXAddress,
        tokenAPrice: tokenXPrice ?? { price: 0 },
        tokenBAddress: tokenYAddress,
        tokenBPrice: tokenYPrice ?? { price: 0 },
        userLiquidity,
        withdrawalAmount: form.state.values.withdrawalAmount,
      });

      if (withdrawalDetails.percentage <= 0) {
        throw new Error("Withdrawal amount must be greater than zero");
      }

      const withdrawPercentage = new Decimal(withdrawalDetails.percentage);
      const withdrawLpAmount = userLpBalanceDecimal
        .mul(withdrawPercentage)
        .div(100);

      if (!withdrawLpAmount.isFinite() || withdrawLpAmount.lte(0)) {
        throw new Error("Withdrawal amount must be greater than zero");
      }

      const expectedX = new Decimal(withdrawalDetails.tokenAAmount);
      const expectedY = new Decimal(withdrawalDetails.tokenBAmount);
      const slippageTolerance = new Decimal(0.01);
      const slippageFactor = new Decimal(1).minus(slippageTolerance);

      const minXOut = expectedX
        .mul(slippageFactor)
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toString();
      const minYOut = expectedY
        .mul(slippageFactor)
        .toDecimalPlaces(0, Decimal.ROUND_FLOOR)
        .toString();

      const gatewayTokenXAddress = getGatewayTokenAddress(tokenXAddress);
      const gatewayTokenYAddress = getGatewayTokenAddress(tokenYAddress);

      const response = await client.liquidity.withdrawLiquidity({
        lpTokenAmount: withdrawLpAmount.toString(),
        minTokenXOut: minXOut,
        minTokenYOut: minYOut,
        ownerAddress: publicKey.toBase58(),
        tokenXMint: gatewayTokenXAddress,
        tokenYMint: gatewayTokenYAddress,
      });

      if (response.success && response.unsignedTransaction) {
        await requestSigning(response.unsignedTransaction, {
          lpTokenAmount: withdrawLpAmount.toString(),
          minTokenXOut: minXOut,
          minTokenYOut: minYOut,
          tokenXMint: gatewayTokenXAddress,
          tokenXOut: expectedX.toString(),
          tokenYMint: gatewayTokenYAddress,
          tokenYOut: expectedY.toString(),
        });
      } else {
        throw new Error(
          response.error || "Failed to create withdrawal transaction",
        );
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      dismissToast();
      toast({
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        title: "Withdrawal Error",
        variant: "error",
      });
      resetWithdrawState();
    }
  };

  const pendingYield = "$0.00";

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <Box className="fixed right-0 flex h-full max-h-full w-full max-w-sm drop-shadow-xl">
        <div className="mb-6 flex justify-between border-green-600 border-b pb-3">
          <Text className="font-bold text-2xl" variant="heading">
            WITHDRAW LIQUIDITY
          </Text>
          <button className="cursor-pointer" onClick={onClose} type="button">
            <Icon className="size-6" name="times" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <Box className="mb-3 flex-row border border-green-400 bg-green-600 px-5 py-3 hover:border-green-300">
              <div>
                <Text.Body2
                  as="label"
                  className="mb-7 block text-green-300 uppercase"
                >
                  Withdrawal Amount
                </Text.Body2>
                <Text.Body2 className="flex max-w-fit items-center bg-green-700 p-2 text-green-300 leading-none">
                  {tokenXSymbol} / {tokenYSymbol}
                </Text.Body2>
              </div>
              <form.Field
                name="withdrawalAmount"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim() === "") {
                      return undefined;
                    }

                    try {
                      const cleanAmount = value.replace(/,/g, "");
                      const amountBN = new Decimal(cleanAmount);

                      if (amountBN.isNaN() || amountBN.lte(0)) {
                        return "Invalid amount";
                      }

                      return undefined;
                    } catch {
                      return "Invalid amount";
                    }
                  },
                }}
              >
                {(field) => (
                  <FormFieldset
                    controls={
                      <Text.Body2 className="flex gap-3 text-green-300 uppercase">
                        <span className="flex gap-3 text-sm">
                          {[25, 50, 75, 100].map((percentage) => (
                            <button
                              className="cursor-pointer uppercase underline"
                              key={percentage}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePercentageClick(percentage);
                              }}
                              type="button"
                            >
                              {percentage}%
                            </button>
                          ))}
                        </span>
                      </Text.Body2>
                    }
                    currencyCode="%"
                    error={field.state.meta.errors.join(", ")}
                    maxAmount={100}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleAmountChange(e);
                    }}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </Box>
          </div>

          {withdrawalCalculations.percentage > 0 && (
            <div className="space-y-2 bg-green-800 p-3">
              <div className="flex items-center justify-between">
                <Text.Body2 className="text-green-300">
                  Total Withdrawal
                </Text.Body2>
                <Text.Body2 className="text-green-300">
                  {numberFormatHelper({
                    decimalScale: 2,
                    trimTrailingZeros: true,
                    value: withdrawalCalculations.percentage,
                  })}
                  %
                </Text.Body2>
              </div>
              <div className="text-green-200 text-lg">
                <div>
                  {numberFormatHelper({
                    decimalScale: 4,
                    trimTrailingZeros: true,
                    value: withdrawalCalculations.tokenXAmount,
                  })}{" "}
                  {tokenXSymbol}
                </div>
                <div>
                  {numberFormatHelper({
                    decimalScale: 4,
                    trimTrailingZeros: true,
                    value: withdrawalCalculations.tokenYAmount,
                  })}{" "}
                  {tokenYSymbol}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 bg-green-600 p-3">
            <Text.Body2 className="text-green-300">Your Liquidity</Text.Body2>
            <div className="text-green-200 text-lg">
              <div>
                {numberFormatHelper({
                  decimalScale: 4,
                  trimTrailingZeros: true,
                  value: liquidityCalculations.userTokenXAmount,
                })}{" "}
                {tokenXSymbol}
              </div>
              <div>
                {numberFormatHelper({
                  decimalScale: 4,
                  trimTrailingZeros: true,
                  value: liquidityCalculations.userTokenYAmount,
                })}{" "}
                {tokenYSymbol}
              </div>
            </div>
          </div>

          <div className="hidden space-y-3">
            <div className="flex justify-between">
              <Text.Body2 className="text-green-300">YOUR LIQUIDITY</Text.Body2>
              <Text.Body2 className="text-green-300">
                ${liquidityCalculations.totalUsdValue}
              </Text.Body2>
            </div>
            <div className="flex justify-between">
              <Text.Body2 className="text-green-300">PENDING YIELD</Text.Body2>
              <Text.Body2 className="text-green-300">{pendingYield}</Text.Body2>
            </div>
          </div>

          <form.Subscribe
            selector={(state) =>
              [state.canSubmit, state.values.withdrawalAmount] as const
            }
          >
            {([canSubmit, withdrawalAmount]) => {
              const hasEnteredValue = !!(
                withdrawalAmount && withdrawalAmount.trim() !== ""
              );
              const isDisabled = !canSubmit || isWithdrawing;

              return (
                <Button
                  className="mt-6 w-full cursor-pointer py-3"
                  disabled={isDisabled}
                  onClick={handleWithdraw}
                  variant={!isDisabled ? "primary" : "secondary"}
                >
                  {withdrawStep === 1
                    ? "PREPARING WITHDRAWAL"
                    : withdrawStep === 2
                      ? "CONFIRM TRANSACTION IN WALLET"
                      : withdrawStep === 3
                        ? "PROCESSING WITHDRAWAL"
                        : !hasEnteredValue
                          ? "SELECT OR ENTER AMOUNT"
                          : "WITHDRAW LIQUIDITY"}
                </Button>
              );
            }}
          </form.Subscribe>
        </div>
      </Box>
    </Modal>
  );
}
