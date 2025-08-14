"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import { sortSolanaAddresses } from "@dex-web/orpc/utils/solana";
import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import { convertToDecimal, numberFormatHelper } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useState } from "react";
import { z } from "zod";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { dismissToast, toast } from "../../../_utils/toast";

//

type WithdrawLiquidityFormSchema = z.infer<typeof withdrawLiquidityFormSchema>;

const withdrawLiquidityFormSchema = z.object({
  withdrawalAmount: z.string().min(1, "Amount is required"),
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
  const queryClient = useQueryClient();
  const [withdrawalCalculations, setWithdrawalCalculations] = useState({
    percentage: 0,
    tokenAAmount: 0,
    tokenBAmount: 0,
    usdValue: 0,
  });

  const maxLpTokens = userLiquidity
    ? convertToDecimal(userLiquidity.lpTokenBalance, userLiquidity.decimals)
    : 0;

  const form = useAppForm({
    defaultValues: {
      withdrawalAmount: "",
    } satisfies WithdrawLiquidityFormSchema,
  });
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data: tokenADetails } = useSuspenseQuery(
    tanstackClient.tokens.getTokenDetails.queryOptions({
      input: { address: tokenAAddress || DEFAULT_BUY_TOKEN },
    }),
  );

  const { data: tokenBDetails } = useSuspenseQuery(
    tanstackClient.tokens.getTokenDetails.queryOptions({
      input: { address: tokenBAddress || DEFAULT_SELL_TOKEN },
    }),
  );

  const { data: tokenAPrice } = useSuspenseQuery(
    tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenAAddress || DEFAULT_BUY_TOKEN,
        quoteCurrency: "USD",
      },
    }),
  );

  const { data: tokenBPrice } = useSuspenseQuery(
    tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: tokenBAddress || DEFAULT_SELL_TOKEN,
        quoteCurrency: "USD",
      },
    }),
  );

  const onWithdrawalAmountChange = (withdrawalAmountPercentage: string) => {
    if (
      !userLiquidity ||
      !poolReserves ||
      !withdrawalAmountPercentage ||
      withdrawalAmountPercentage.trim() === "" ||
      withdrawalAmountPercentage === "0" ||
      poolReserves.totalLpSupply === 0
    ) {
      setWithdrawalCalculations({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
      return;
    }

    const userLpBalance = convertToDecimal(
      userLiquidity.lpTokenBalance,
      userLiquidity.decimals,
    );

    let withdrawLpPercentage: BigNumber;
    try {
      withdrawLpPercentage = BigNumber(
        withdrawalAmountPercentage.replace(/,/g, ""),
      );
      if (withdrawLpPercentage.isNaN() || withdrawLpPercentage.lte(0)) {
        setWithdrawalCalculations({
          percentage: 0,
          tokenAAmount: 0,
          tokenBAmount: 0,
          usdValue: 0,
        });
        return;
      }
    } catch {
      setWithdrawalCalculations({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
      return;
    }

    const percentage = withdrawLpPercentage.toNumber();

    const withdrawLpAmount = userLpBalance.multipliedBy(percentage / 100);
    const withdrawLpShare = withdrawLpAmount.dividedBy(
      poolReserves.totalLpSupply,
    );

    // Compute X/Y withdrawal then map to A/B for display
    const tokenXAmount = withdrawLpShare
      .multipliedBy(poolReserves.reserveX)
      .toNumber();
    const tokenYAmount = withdrawLpShare
      .multipliedBy(poolReserves.reserveY)
      .toNumber();

    const tokenA = tokenAAddress || DEFAULT_BUY_TOKEN;
    const tokenB = tokenBAddress || DEFAULT_SELL_TOKEN;
    const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
      tokenA,
      tokenB,
    );

    const tokenAAmount = tokenA === tokenXAddress ? tokenXAmount : tokenYAmount;
    const tokenBAmount = tokenB === tokenYAddress ? tokenYAmount : tokenXAmount;

    const tokenAValue = BigNumber(tokenAAmount).multipliedBy(
      tokenAPrice.price || 0,
    );
    const tokenBValue = BigNumber(tokenBAmount).multipliedBy(
      tokenBPrice.price || 0,
    );
    const usdValue = tokenAValue.plus(tokenBValue).toNumber();

    setWithdrawalCalculations({
      percentage,
      tokenAAmount,
      tokenBAmount,
      usdValue,
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
        title: "Confirm withdrawal [2/3]",
        variant: "loading",
      });

      const unsignedTransactionBuffer = Buffer.from(
        unsignedTransaction,
        "base64",
      );
      const transaction = Transaction.from(unsignedTransactionBuffer);

      const signedTransaction = await signTransaction(transaction);

      setWithdrawStep(3);
      toast({
        description: "Submitting transaction to the blockchain...",
        title: "Processing withdrawal [3/3]",
        variant: "loading",
      });

      const signedTransactionBase64 = Buffer.from(
        signedTransaction.serialize(),
      ).toString("base64");

      const submitRes = await client.liquidity.submitWithdrawal({
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
      toast({
        description: `Successfully withdrew ${form.state.values.withdrawalAmount} LP tokens. Transaction: ${submitRes.signature}`,
        title: "Withdrawal complete",
        variant: "success",
      });

      // Invalidate related queries
      try {
        const userLiqOpts =
          tanstackClient.liquidity.getUserLiquidity.queryOptions({
            input: {
              ownerAddress: publicKey.toBase58(),
              tokenXMint: opts.tokenXMint,
              tokenYMint: opts.tokenYMint,
            },
          });
        const reservesOpts = tanstackClient.pools.getPoolReserves.queryOptions({
          input: { tokenXMint: opts.tokenXMint, tokenYMint: opts.tokenYMint },
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: userLiqOpts.queryKey }),
          queryClient.invalidateQueries({ queryKey: reservesOpts.queryKey }),
        ]);
      } catch {}

      form.reset();
      onClose();
      resetWithdrawState();
    } catch (error) {
      console.error("Signing error:", error);
      dismissToast();
      toast({
        description: `${error instanceof Error ? error.message : "Unknown error occurred"}`,
        title: "Transaction Error",
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

    if (isWithdrawing) return;

    toast({
      description: "Building withdrawal transaction...",
      title: "Preparing withdrawal [1/3]",
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

      const userLpBalance = convertToDecimal(
        userLiquidity?.lpTokenBalance || 0,
        9,
      );

      const slippageTolerance = 0.01;
      const withdrawLpAmountPercentage = BigNumber(
        form.state.values.withdrawalAmount.replace(/,/g, ""),
      );
      const withdrawLpAmount = withdrawLpAmountPercentage
        .multipliedBy(userLpBalance)
        .dividedBy(100);

      const withdrawShare = withdrawLpAmount.dividedBy(
        poolReserves?.totalLpSupply || 1,
      );
      const expectedX = withdrawShare.multipliedBy(poolReserves?.reserveX || 0);
      const expectedY = withdrawShare.multipliedBy(poolReserves?.reserveY || 0);

      const minXOut = expectedX
        .multipliedBy(1 - slippageTolerance)
        .integerValue(BigNumber.ROUND_FLOOR)
        .toString();
      const minYOut = expectedY
        .multipliedBy(1 - slippageTolerance)
        .integerValue(BigNumber.ROUND_FLOOR)
        .toString();

      const response = await client.liquidity.withdrawLiquidity({
        lpTokenAmount: withdrawLpAmount.toString(),
        minTokenXOut: minXOut,
        minTokenYOut: minYOut,
        ownerAddress: publicKey.toBase58(),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
      });

      if (response.success && response.unsignedTransaction) {
        await requestSigning(response.unsignedTransaction, {
          lpTokenAmount: withdrawLpAmount.toString(),
          minTokenXOut: minXOut,
          minTokenYOut: minYOut,
          tokenXMint: tokenXAddress,
          tokenYMint: tokenYAddress,
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

  const totalLiquidity =
    userLiquidity && poolReserves
      ? numberFormatHelper({
          decimalScale: 2,
          value: withdrawalCalculations.usdValue,
        })
      : "0.00";

  const userLpShare =
    userLiquidity && poolReserves
      ? BigNumber(userLiquidity.lpTokenBalance).dividedBy(
          poolReserves.totalLpSupply,
        )
      : BigNumber(0);

  const userTokenAAmount =
    userLpShare && poolReserves
      ? userLpShare
          .multipliedBy(poolReserves.reserveY)
          .dividedBy(10 ** tokenADetails.decimals)
          .toNumber()
      : 0;
  const userTokenBAmount =
    userLpShare && poolReserves
      ? userLpShare
          .multipliedBy(poolReserves.reserveX)
          .dividedBy(10 ** tokenBDetails.decimals)
          .toNumber()
      : 0;

  const pendingYield = "$0.00";

  if (!isOpen) return null;

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
                <Text.Body2 className="flex max-w-fit items-center bg-green-700 p-2 text-green-300 leading-none">
                  {tokenADetails.symbol} / {tokenBDetails.symbol}
                </Text.Body2>
              </div>
              <form.Field
                name="withdrawalAmount"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim() === "") {
                      return undefined; // Allow empty for better UX
                    }

                    return undefined;
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
                    maxAmount={100}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleAmountChange(e);
                      // console.log("e.target.value", e.target.value);
                      // field.handleChange(e.target.value);
                    }}
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </Box>
          </div>

          {withdrawalCalculations.percentage > 0 && (
            <div className="space-y-2 rounded border border-green-600 bg-green-800 p-3">
              <Text.Body2 className="text-green-300">
                Total Withdrawal
              </Text.Body2>
              <Text.Body2 className="text-green-200 text-lg">
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
              </Text.Body2>
            </div>
          )}

          <div className="space-y-2 rounded border border-green-400 bg-green-600 p-3">
            <Text.Body2 className="text-green-300">Your Liquidity</Text.Body2>
            <Text.Body2 className="text-green-200 text-lg">
              <div>
                {numberFormatHelper({
                  decimalScale: 4,
                  trimTrailingZeros: true,
                  value: userTokenAAmount,
                })}{" "}
                {tokenADetails.symbol}
              </div>
              <div>
                {numberFormatHelper({
                  decimalScale: 4,
                  trimTrailingZeros: true,
                  value: userTokenBAmount,
                })}{" "}
                {tokenBDetails.symbol}
              </div>
            </Text.Body2>
          </div>

          <div className="hidden space-y-3">
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
                    ? "PREPARING WITHDRAWAL [1/3]"
                    : withdrawStep === 2
                      ? "CONFIRM TRANSACTION IN WALLET [2/3]"
                      : withdrawStep === 3
                        ? "PROCESSING WITHDRAWAL [3/3]"
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
