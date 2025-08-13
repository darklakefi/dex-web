"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/orpc/utils/solana";
import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import { convertToDecimal, numberFormatHelper } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useMemo, useState } from "react";
import { z } from "zod";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { dismissToast, toast } from "../../../_utils/toast";

type WithdrawLiquidityFormSchema = z.infer<typeof withdrawLiquidityFormSchema>;

const withdrawLiquidityFormSchema = z.object({
  withdrawalAmount: z.string().min(1),
});
export const { fieldContext, formContext } = createFormHookContexts();

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
    withdrawalAmount: "",
  } satisfies WithdrawLiquidityFormSchema,
  onSubmit: async ({ value }: { value: { withdrawalAmount: string } }) => {
    console.log(value);
  },
  validators: {
    onChange: withdrawLiquidityFormSchema,
  },
};

interface WithdrawLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenAAddress?: string;
  tokenBAddress?: string;
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
}

export function WithdrawLiquidityModal({
  isOpen,
  onClose,
  tokenAAddress,
  tokenBAddress,
  poolReserves,
  userLiquidity,
}: WithdrawLiquidityModalProps) {
  const { publicKey, signTransaction } = useWallet();
  const form = useAppForm(formConfig);
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null,
  );
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data: tokenADetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: tokenAAddress || DEFAULT_BUY_TOKEN },
    }),
  );

  const { data: tokenBDetails } = useSuspenseQuery(
    tanstackClient.getTokenDetails.queryOptions({
      input: { address: tokenBAddress || DEFAULT_SELL_TOKEN },
    }),
  );

  const { data: tokenAPrice } = useSuspenseQuery(
    tanstackClient.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenAAddress || DEFAULT_BUY_TOKEN,
        quoteCurrency: "USD",
      },
    }),
  );

  const { data: tokenBPrice } = useSuspenseQuery(
    tanstackClient.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenBAddress || DEFAULT_SELL_TOKEN,
        quoteCurrency: "USD",
      },
    }),
  );

  const withdrawalCalculations = useMemo(() => {
    if (
      !userLiquidity ||
      !poolReserves ||
      !form.state.values.withdrawalAmount ||
      poolReserves.totalLpSupply === 0
    ) {
      return {
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      };
    }

    const userLpBalance = convertToDecimal(
      userLiquidity.lpTokenBalance,
      userLiquidity.decimals,
    );
    const withdrawLpAmount = BigNumber(form.state.values.withdrawalAmount);

    const percentage = withdrawLpAmount
      .dividedBy(userLpBalance)
      .multipliedBy(100);

    const withdrawLpShare = withdrawLpAmount.dividedBy(
      poolReserves.totalLpSupply,
    );

    const tokenAAmount = withdrawLpShare
      .multipliedBy(poolReserves.reserveY)
      .toNumber();
    const tokenBAmount = withdrawLpShare
      .multipliedBy(poolReserves.reserveX)
      .toNumber();

    const tokenAValue = BigNumber(tokenAAmount).multipliedBy(
      tokenAPrice.price || 0,
    );
    const tokenBValue = BigNumber(tokenBAmount).multipliedBy(
      tokenBPrice.price || 0,
    );
    const usdValue = tokenAValue.plus(tokenBValue).toNumber();

    return {
      percentage: percentage.toNumber(),
      tokenAAmount,
      tokenBAmount,
      usdValue,
    };
  }, [
    form.state.values.withdrawalAmount,
    userLiquidity,
    poolReserves,
    tokenAPrice,
    tokenBPrice,
  ]);

  if (!isOpen) return null;

  const maxLpTokens = userLiquidity
    ? convertToDecimal(userLiquidity.lpTokenBalance, userLiquidity.decimals)
    : 0;

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    const amount = BigNumber(maxLpTokens)
      .multipliedBy(percentage / 100)
      .toString();
    form.setFieldValue("withdrawalAmount", amount);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "");
    form.setFieldValue("withdrawalAmount", value);
    setSelectedPercentage(null);
  };

  const resetWithdrawState = () => {
    setWithdrawStep(0);
    setIsWithdrawing(false);
  };

  const requestSigning = async (unsignedTransaction: string) => {
    try {
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signTransaction)
        throw new Error("Wallet does not support transaction signing!");

      setWithdrawStep(2);
      setIsWithdrawing(true);
      toast({
        description: "Please confirm the transaction in your wallet.",
        title: "Confirm withdrawal [2/2]",
        variant: "loading",
      });

      const unsignedTransactionBuffer = Buffer.from(
        unsignedTransaction,
        "base64",
      );
      const transaction = Transaction.from(unsignedTransactionBuffer);

      const signedTransaction = await signTransaction(transaction);

      dismissToast();
      toast({
        description: `Successfully withdrew ${form.state.values.withdrawalAmount} LP tokens`,
        title: "Withdrawal complete",
        variant: "success",
      });

      form.reset();
      onClose();
      resetWithdrawState();
    } catch (error) {
      console.error("Signing error:", error);
      dismissToast();
      toast({
        description: `${error instanceof Error ? error.message : "Unknown error occurred"}`,
        title: "Signing Error",
        variant: "error",
      });
      resetWithdrawState();
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey) {
      toast({
        description: "Missing wallet address or token information",
        title: "Withdrawal Error",
        variant: "error",
      });
      return;
    }

    if (!isValidAmount || isWithdrawing) return;

    toast({
      description: "Building withdrawal transaction...",
      title: "Preparing withdrawal [1/2]",
      variant: "loading",
    });
    setWithdrawStep(1);
    setIsWithdrawing(true);

    try {
      const tokenA = tokenAAddress || DEFAULT_BUY_TOKEN;
      const tokenB = tokenBAddress || DEFAULT_SELL_TOKEN;
      const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
        tokenA,
        tokenB,
      );

      const slippageTolerance = 0.01;
      const minTokenAOut = Math.floor(
        withdrawalCalculations.tokenAAmount * (1 - slippageTolerance),
      );
      const minTokenBOut = Math.floor(
        withdrawalCalculations.tokenBAmount * (1 - slippageTolerance),
      );

      const response = await client.withdrawLiquidity({
        lpTokenAmount: form.state.values.withdrawalAmount,
        minTokenXOut: minTokenBOut.toString(),
        minTokenYOut: minTokenAOut.toString(),
        ownerAddress: publicKey.toBase58(),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      });

      if (response.success && response.unsignedTransaction) {
        await requestSigning(response.unsignedTransaction);
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

  const isValidAmount =
    form.state.values.withdrawalAmount &&
    BigNumber(form.state.values.withdrawalAmount).gt(0) &&
    BigNumber(form.state.values.withdrawalAmount).lte(maxLpTokens);

  const totalLiquidity =
    userLiquidity && poolReserves
      ? numberFormatHelper({
          decimalScale: 2,
          value: withdrawalCalculations.usdValue,
        })
      : "0.00";

  const pendingYield = "$0.00";

  return (
    <Modal onClose={onClose}>
      <Box className="fixed right-0 flex h-full max-h-full w-full max-w-sm drop-shadow-xl">
        <div className="mb-6 flex justify-between border-green-600 border-b pb-3">
          <Text className="font-bold text-2xl" variant="heading">
            WITHDRAW LIQUIDITY
          </Text>
          <button onClick={onClose} type="button">
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
                <div className="flex max-w-fit items-center bg-green-700 p-2 text-green-300 leading-none">
                  {tokenADetails.symbol} / {tokenBDetails.symbol}
                </div>
              </div>
              <form.Field name="withdrawalAmount">
                {(field) => (
                  <FormFieldset
                    controls={
                      <Text.Body2 className="flex gap-3 text-green-300 uppercase">
                        <span className="flex gap-3 text-sm">
                          {[25, 50, 75, 100].map((percentage) => (
                            <button
                              className="cursor-pointer uppercase underline"
                              key={percentage}
                              onClick={() => handlePercentageClick(percentage)}
                              type="button"
                            >
                              {percentage}%
                            </button>
                          ))}
                        </span>
                      </Text.Body2>
                    }
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleAmountChange(e);
                      field.handleChange(e.target.value);
                    }}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </Box>
          </div>

          {form.state.values.withdrawalAmount &&
            BigNumber(form.state.values.withdrawalAmount).gt(0) && (
              <div className="space-y-2 rounded border border-green-600 bg-green-900 p-3">
                <Text.Body3 className="text-green-300">
                  Total Withdrawal
                </Text.Body3>
                <div className="text-green-400 text-sm">
                  <div>
                    {numberFormatHelper({
                      decimalScale: 4,
                      trimTrailingZeros: true,
                      value: withdrawalCalculations.tokenAAmount,
                    })}{" "}
                    {tokenADetails.symbol}
                  </div>
                  <div>
                    {numberFormatHelper({
                      decimalScale: 4,
                      trimTrailingZeros: true,
                      value: withdrawalCalculations.tokenBAmount,
                    })}{" "}
                    {tokenBDetails.symbol}
                  </div>
                </div>
              </div>
            )}

          <div className="space-y-3">
            <div className="flex justify-between">
              <Text.Body2 className="text-green-300">YOUR LIQUIDITY</Text.Body2>
              <Text.Body2 className="text-green-300">
                ${totalLiquidity}
              </Text.Body2>
            </div>
            <div className="flex justify-between">
              <Text.Body2 className="text-green-300">PENDING YIELD</Text.Body2>
              <Text.Body2 className="text-green-300">{pendingYield}</Text.Body2>
            </div>
          </div>

          <Button
            className="mt-6 w-full py-3"
            disabled={!isValidAmount || isWithdrawing}
            onClick={handleWithdraw}
            variant={isValidAmount && !isWithdrawing ? "primary" : "secondary"}
          >
            {withdrawStep === 1
              ? "PREPARING WITHDRAWAL [1/2]"
              : withdrawStep === 2
                ? "CONFIRM TRANSACTION IN WALLET [2/2]"
                : !form.state.values.withdrawalAmount ||
                    BigNumber(form.state.values.withdrawalAmount).eq(0)
                  ? "SELECT OR ENTER AMOUNT"
                  : "WITHDRAW LIQUIDITY"}
          </Button>
        </div>
      </Box>
    </Modal>
  );
}
