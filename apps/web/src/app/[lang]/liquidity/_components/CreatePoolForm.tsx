"use client";

import {
  ERROR_MESSAGES,
  useLiquidityTracking,
  useTokenAccounts,
  useTransactionState,
  useTransactionStatus,
  useTransactionToasts,
} from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import type { CreatePoolTransactionInput, Token } from "@dex-web/orpc/schemas";
import { Box, Button, Icon, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  numberFormatHelper,
  parseAmount,
  sortSolanaAddresses,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQueries } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { useState } from "react";
import { z } from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { WalletButton } from "../../../_components/WalletButton";
import { EMPTY_TOKEN, LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { isSquadsX } from "../../../_utils/isSquadsX";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { dismissToast, toast } from "../../../_utils/toast";
import { getCreatePoolFormButtonMessage } from "../_utils/getCreatePoolFormButtonMessage";
import { requestCreatePoolTransactionSigning } from "../_utils/requestCreatePoolTransactionSigning";
import { validateHasSufficientBalance } from "../_utils/validateHasSufficientBalance";

const { fieldContext, formContext } = createFormHookContexts();

const liquidityFormSchema = z.object({
  initialPrice: z.string(),
  tokenAAmount: z.string(),
  tokenBAmount: z.string(),
});

export type LiquidityFormSchema = z.infer<typeof liquidityFormSchema>;

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

const serialize = createSerializer(liquidityPageParsers);

export function CreatePoolForm() {
  const router = useRouter();
  const { publicKey, wallet, signTransaction } = useWallet();
  const { trackLiquidity, trackError } = useAnalytics();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );
  const createState = useTransactionState(0, false, false);

  const tx = useTranslations("liquidity");

  const [initialPriceTokenOrder, setInitialPriceDirection] = useState<
    "ab" | "ba"
  >("ab");

  const isMissingTokens =
    tokenAAddress === EMPTY_TOKEN || tokenBAddress === EMPTY_TOKEN;

  const sortedTokenAddresses = isMissingTokens
    ? { tokenXAddress: tokenAAddress, tokenYAddress: tokenBAddress }
    : (() => {
        try {
          return sortSolanaAddresses(tokenAAddress, tokenBAddress);
        } catch (_error) {
          return { tokenXAddress: tokenAAddress, tokenYAddress: tokenBAddress };
        }
      })();

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const [{ data: poolDetails }, { data: tokenMetadata }] = useSuspenseQueries({
    queries: [
      tanstackClient.pools.getPoolDetails.queryOptions({
        input: {
          tokenXMint,
          tokenYMint,
        },
      }),
      tanstackClient.tokens.getTokenMetadata.queryOptions({
        input: {
          addresses: [tokenXMint, tokenYMint],
          returnAsObject: true,
        },
      }),
    ],
  });

  const {
    buyTokenAccount,
    sellTokenAccount,
    refetchBuyTokenAccount,
    refetchSellTokenAccount,
  } = useTokenAccounts({
    publicKey,
    tanstackClient,
    tokenAAddress,
    tokenBAddress,
  });

  const metadata = tokenMetadata as Record<string, Token>;
  const tokenADetails = metadata[tokenXMint];
  const tokenBDetails = metadata[tokenYMint];

  const { trackSigned, trackConfirmed, trackFailed } = useLiquidityTracking({
    trackError: (error: unknown, context?: Record<string, unknown>) => {
      trackError({
        context: "liquidity",
        details: context,
        error: error instanceof Error ? error.message : String(error),
      });
    },
    trackLiquidity,
  });

  const toasts = useTransactionToasts({
    customMessages: {
      squadsXFailure: {
        description: tx("squadsX.responseStatus.failed.description"),
        title: tx("squadsX.responseStatus.failed.title"),
      },
      squadsXSuccess: {
        description: tx("squadsX.responseStatus.confirmed.description"),
        title: tx("squadsX.responseStatus.confirmed.title"),
      },
    },
    dismissToast,
    isSquadsX: isSquadsX(wallet),
    toast,
    transactionType: "POOL_CREATION",
  });

  const statusChecker = useTransactionStatus({
    checkStatus: async (signature: string) => {
      const response = await client.liquidity.checkLiquidityTransactionStatus({
        signature,
      });
      return {
        data: response,
        error: response.error,
        status: response.status,
      };
    },
    failStates: ["failed"],
    maxAttempts: 15,
    onFailure: (result) => {
      createState.reset();
      toasts.dismiss();
      toasts.showErrorToast(
        `Transaction failed: ${result.error || "Unknown error"}`,
      );
    },
    onStatusUpdate: (status, attempt) => {
      toasts.dismiss();
      toasts.showStatusToast(
        `Finalizing transaction... (${attempt}/15) - ${status}`,
      );
    },
    onSuccess: (result) => {
      toasts.dismiss();
      if (result.error) {
        createState.reset();
        toasts.showErrorToast(`Transaction failed: ${result.error}`);

        const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
        const tokenBAmount = parseAmount(form.state.values.tokenBAmount);
        trackFailed({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
          transactionHash: "",
        });
        return;
      }

      createState.reset();
      const tokenAAmount = parseAmount(form.state.values.tokenAAmount);
      const tokenBAmount = parseAmount(form.state.values.tokenBAmount);

      trackConfirmed({
        action: "add",
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress || "",
        tokenB: tokenBAddress || "",
        transactionHash: "",
      });

      const successMessage = !isSquadsX(wallet)
        ? `CREATED POOL: ${form.state.values.tokenAAmount} ${tokenBAddress} + ${form.state.values.tokenBAmount} ${tokenAAddress}`
        : undefined;

      toasts.showSuccessToast(successMessage);
      refetchBuyTokenAccount();
      refetchSellTokenAccount();
      const urlWithParams = serialize("liquidity", {
        tokenAAddress,
        tokenBAddress,
        type: LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY,
      });
      router.push(`/${urlWithParams}`);
    },
    onTimeout: () => {
      createState.reset();
      toasts.showErrorToast(
        "Transaction may still be processing. Check explorer for status.",
      );
    },
    retryDelay: 2000,
    successStates: ["finalized"],
  });

  const formConfig = {
    defaultValues: {
      initialPrice: "1",
      tokenAAmount: "0",
      tokenBAmount: "0",
    } satisfies LiquidityFormSchema,
    onSubmit: async ({
      value,
    }: {
      value: { tokenAAmount: string; tokenBAmount: string };
    }) => {
      // Form submission handled by button onClick
    },
    validators: {
      onChange: liquidityFormSchema,
      onDynamic: ({ value }: { value: LiquidityFormSchema }) => {
        if (
          value.tokenAAmount &&
          publicKey &&
          buyTokenAccount?.tokenAccounts?.[0]
        ) {
          const tokenANumericValue = value.tokenAAmount.replace(/,/g, "");
          if (BigNumber(tokenANumericValue).gt(0)) {
            const tokenAccount = buyTokenAccount.tokenAccounts[0];
            const maxBalance = convertToDecimal(
              tokenAccount.amount || 0,
              tokenAccount.decimals || 0,
            );

            if (BigNumber(tokenANumericValue).gt(maxBalance)) {
              const symbol = tokenAccount.symbol || "token";
              return { tokenAAmount: `Insufficient ${symbol} balance.` };
            }
          }
        }
      },
    },
  };

  const form = useAppForm(formConfig);

  const showCreatePoolStepToast = (step: number) => {
    toasts.showStepToast(step);
  };

  const handleCreatePool = async (
    tokenAmountA: string,
    tokenAmountB: string,
    exchangeRate: string,
  ) => {
    if (!publicKey) {
      toasts.showErrorToast(ERROR_MESSAGES.MISSING_WALLET_INFO);
      return;
    }

    if (isMissingTokens) {
      toasts.showErrorToast(ERROR_MESSAGES.MISSING_TOKEN_ADDRESSES);
      return;
    }

    const tokenAAmount = parseAmount(tokenAmountA);
    const tokenBAmount = parseAmount(tokenAmountB);
    const initialPrice = Number(exchangeRate || "1");

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
      toasts.showErrorToast(ERROR_MESSAGES.INVALID_AMOUNTS);
      return;
    }

    if (initialPrice <= 0) {
      toasts.showErrorToast(ERROR_MESSAGES.INVALID_PRICE);
      return;
    }

    try {
      createState.setStep(1);
      toasts.showStepToast(1);

      if (!tokenAAddress || !tokenBAddress) {
        throw new Error(ERROR_MESSAGES.MISSING_TOKEN_ADDRESSES);
      }

      if (!wallet) {
        throw new Error(ERROR_MESSAGES.MISSING_WALLET);
      }

      let sortedTokens: { tokenXAddress: string; tokenYAddress: string };
      try {
        sortedTokens = sortSolanaAddresses(tokenAAddress, tokenBAddress);
      } catch (_error) {
        throw new Error(
          `Invalid token addresses: ${tokenAAddress} or ${tokenBAddress} is not a valid Solana public key`,
        );
      }
      const { tokenXAddress, tokenYAddress } = sortedTokens;

      const depositAmountX =
        tokenXAddress === tokenAAddress ? tokenAAmount : tokenBAmount;
      const tokenXDecimals =
        tokenXAddress === tokenAAddress
          ? tokenADetails?.decimals || 0
          : tokenBDetails?.decimals || 0;
      const depositAmountY =
        tokenYAddress === tokenAAddress ? tokenAAmount : tokenBAmount;
      const tokenYDecimals =
        tokenYAddress === tokenAAddress
          ? tokenADetails?.decimals || 0
          : tokenBDetails?.decimals || 0;

      const response = await client.pools.createPoolTransaction({
        depositAmountX: BigNumber(depositAmountX)
          .multipliedBy(10 ** tokenXDecimals)
          .toFixed(0),
        depositAmountY: BigNumber(depositAmountY)
          .multipliedBy(10 ** tokenYDecimals)
          .toFixed(0),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      } satisfies CreatePoolTransactionInput);

      if (response.success && response.transaction) {
        trackSigned({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
        });

        requestCreatePoolTransactionSigning({
          checkTransactionStatus,
          publicKey,
          setCreateStep: createState.setStep,
          showCreatePoolStepToast,
          signTransaction,
          unsignedTransaction: response.transaction,
        });
      } else {
        throw new Error("Failed to create pool transaction");
      }
    } catch (error) {
      toasts.dismiss();
      toasts.showErrorToast(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
      createState.reset();
    }
  };

  const checkTransactionStatus = async (signature: string) => {
    await statusChecker.checkTransactionStatus(signature);
  };

  const handleInitialPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value;
    const tokenBAmount = form.state.values.tokenBAmount.replace(/,/g, "");
    if (
      price &&
      tokenBAmount &&
      BigNumber(price).gt(0) &&
      BigNumber(tokenBAmount).gt(0)
    ) {
      let calculatedTokenA: string;

      if (initialPriceTokenOrder === "ab") {
        calculatedTokenA = BigNumber(tokenBAmount)
          .multipliedBy(price)
          .toString();
      } else {
        calculatedTokenA = BigNumber(tokenBAmount).dividedBy(price).toString();
      }

      form.setFieldValue("tokenAAmount", calculatedTokenA);
    }
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = e.target.value.replace(/,/g, "");
    const price = form.state.values.initialPrice || "1";

    if (type === "sell") {
      if (BigNumber(value).gt(0) && BigNumber(price).gt(0)) {
        const calculatedTokenA =
          initialPriceTokenOrder === "ab"
            ? BigNumber(value).multipliedBy(price).toString()
            : BigNumber(value).dividedBy(price).toString();
        form.setFieldValue("tokenAAmount", calculatedTokenA);
      }
    } else {
      if (BigNumber(value).gt(0) && BigNumber(price).gt(0)) {
        const calculatedTokenB =
          initialPriceTokenOrder === "ab"
            ? BigNumber(value).dividedBy(price).toString()
            : BigNumber(value).multipliedBy(price).toString();
        form.setFieldValue("tokenBAmount", calculatedTokenB);
      }
    }
  };

  const handleChangeInitialPriceDirection = () => {
    const newInitialPriceTokenOrder =
      initialPriceTokenOrder === "ab" ? "ba" : "ab";
    setInitialPriceDirection(newInitialPriceTokenOrder);

    const price = form.state.values.initialPrice || "1";
    if (BigNumber(price).gt(0)) {
      form.setFieldValue("initialPrice", BigNumber(1).div(price).toString());
    } else {
      form.setFieldValue("initialPrice", price);
    }
  };

  const [initialPriceTokenX, initialPriceTokenY] =
    initialPriceTokenOrder === "ba"
      ? [tokenADetails, tokenBDetails]
      : [tokenBDetails, tokenADetails];

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
                {tokenBAddress === EMPTY_TOKEN ? "SELECT TOKEN" : "TOKEN"}
              </Text.Body2>
              <SelectTokenButton returnUrl="liquidity" type="sell" />
            </div>
            <form.Field
              name="tokenBAmount"
              validators={{
                onChange: ({ value }) => {
                  return validateHasSufficientBalance({
                    amount: value,
                    tokenAccount: sellTokenAccount?.tokenAccounts[0],
                  });
                },
                onChangeListenTo: ["tokenAAmount"],
              }}
            >
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
            <div className="inline-flex size-8 items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300">
              <Icon className="size-5" name="plus" />
            </div>
          </div>

          <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
            <div>
              <Text.Body2
                as="label"
                className="mb-3 block text-green-300 uppercase"
              >
                {tokenAAddress === EMPTY_TOKEN ? "SELECT TOKEN" : "TOKEN"}
              </Text.Body2>
              <SelectTokenButton returnUrl="liquidity" type="buy" />
            </div>
            <form.Field
              name="tokenAAmount"
              validators={{
                onChange: ({ value }) => {
                  return validateHasSufficientBalance({
                    amount: value,
                    tokenAccount: buyTokenAccount?.tokenAccounts[0],
                  });
                },
                onChangeListenTo: ["tokenBAmount"],
              }}
            >
              {(field) => (
                <FormFieldset
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
          <Text.Body2 className="mb-2 text-green-100">
            Your selection will create a new liquidity pool
          </Text.Body2>
          {!poolDetails && !isMissingTokens && (
            <div>
              <Box className="mb-3 flex-row border border-green-400 bg-green-600 px-5 py-3 hover:border-green-300">
                <div>
                  <Text.Body2
                    as="label"
                    className="mb-7 block text-green-300 uppercase"
                  >
                    Set initial price
                  </Text.Body2>
                  <div className="flex items-center">
                    {initialPriceTokenX?.imageUrl ? (
                      <Image
                        alt={initialPriceTokenX?.symbol}
                        className="mr-2 size-6 overflow-hidden rounded-full"
                        height={24}
                        priority
                        src={initialPriceTokenX?.imageUrl}
                        unoptimized
                        width={24}
                      />
                    ) : (
                      <Icon className="mr-2 fill-green-200" name="seedlings" />
                    )}
                    <Text.Body2 className="text-green-200 text-lg">
                      1 {initialPriceTokenX?.symbol} =
                    </Text.Body2>
                  </div>
                </div>
                <form.Field name="initialPrice">
                  {(field) => (
                    <FormFieldset
                      controls={
                        <button
                          className="cursor-pointer"
                          onClick={handleChangeInitialPriceDirection}
                          type="button"
                        >
                          <Icon className="rotate-90" name="swap" />
                        </button>
                      }
                      currencyCode={initialPriceTokenY?.symbol}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        handleInitialPriceChange(e);
                        field.handleChange(e.target.value);
                      }}
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </Box>
              <Text.Body2 className="text-green-300">
                <span className="text-green-100">Warning:</span> Bots will
                arbitrage any mispricing. you'll lose tokens if your rate is
                off-market.
              </Text.Body2>
            </div>
          )}

          <div className="w-full">
            {!publicKey ? (
              <WalletButton className="w-full py-3" />
            ) : poolDetails ? (
              <Button
                className="w-full cursor-pointer py-3 leading-6"
                onClick={() => {
                  const urlWithParams = serialize("liquidity", {
                    tokenAAddress,
                    tokenBAddress,
                    type: LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY,
                  });
                  router.push(`/${urlWithParams}`);
                  return;
                }}
              >
                {tx("createPool.poolExists")}
              </Button>
            ) : (
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Button
                    className="w-full cursor-pointer py-3 leading-6"
                    disabled={
                      isMissingTokens ||
                      !form.state.canSubmit ||
                      createState.step !== 0
                    }
                    loading={createState.step !== 0}
                    onClick={() =>
                      handleCreatePool(
                        values.tokenAAmount,
                        values.tokenBAmount,
                        values.initialPrice,
                      )
                    }
                  >
                    {getCreatePoolFormButtonMessage({
                      buyTokenAccount,
                      createStep: createState.step,
                      initialPrice: values.initialPrice,
                      publicKey,
                      sellTokenAccount,
                      tokenAAddress,
                      tokenAAmount: values.tokenAAmount,
                      tokenBAddress,
                      tokenBAmount: values.tokenBAmount,
                    })}
                  </Button>
                )}
              </form.Subscribe>
            )}
          </div>
        </div>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const tokenAAmount = values.tokenAAmount.replace(/,/g, "");
            const tokenBAmount = values.tokenBAmount.replace(/,/g, "");
            return (
              <>
                {!poolDetails &&
                  BigNumber(tokenAAmount).gt(0) &&
                  BigNumber(tokenBAmount).gt(0) && (
                    <div className="mt-4 space-y-3 border-green-600 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Text.Body2 className="text-green-300">
                          Initial Deposit
                        </Text.Body2>
                        <div className="text-right">
                          <Text.Body2 className="text-green-200">
                            {numberFormatHelper({
                              decimalScale: 5,
                              trimTrailingZeros: true,
                              value: tokenAAmount,
                            })}{" "}
                            {buyTokenAccount?.tokenAccounts[0]?.symbol}
                          </Text.Body2>
                          <Text.Body2 className="text-green-200">
                            {numberFormatHelper({
                              decimalScale: 5,
                              trimTrailingZeros: true,
                              value: tokenBAmount,
                            })}{" "}
                            {sellTokenAccount?.tokenAccounts[0]?.symbol}
                          </Text.Body2>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Text.Body2 className="text-green-300">
                          Initial Price
                        </Text.Body2>
                        <Text.Body2 className="text-green-200">
                          1 {buyTokenAccount?.tokenAccounts[0]?.symbol} ={" "}
                          {values.initialPrice}{" "}
                          {sellTokenAccount?.tokenAccounts[0]?.symbol}
                        </Text.Body2>
                      </div>

                      <div className="flex items-center justify-between">
                        <Text.Body2 className="text-green-300">
                          Your Pool Share
                        </Text.Body2>
                        <Text.Body2 className="text-green-200">100%</Text.Body2>
                      </div>
                    </div>
                  )}
              </>
            );
          }}
        </form.Subscribe>
      </Box>
      <div className="size-9" />
    </section>
  );
}
