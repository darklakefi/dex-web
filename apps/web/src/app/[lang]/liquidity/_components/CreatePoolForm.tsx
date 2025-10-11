"use client";

import {
  ERROR_MESSAGES,
  useLiquidityTracking,
  useTokenAccounts,
  useTransactionState,
  useTransactionToasts,
} from "@dex-web/core";
import { client, tanstackClient } from "@dex-web/orpc";
import type {
  CreatePoolTransactionInput,
  GetTokenPriceOutput,
} from "@dex-web/orpc/schemas/index";
import { Box, Button, Icon, Text } from "@dex-web/ui";
import {
  numberFormatHelper,
  parseAmount,
  sortSolanaAddresses,
} from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createSerializer, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import * as z from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { WalletButton } from "../../../_components/WalletButton";
import { EMPTY_TOKEN, LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { generateTrackingId } from "../../../_utils/generateTrackingId";
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

interface CreatePoolFormProps {
  tokenPrices?: Record<string, GetTokenPriceOutput | undefined>;
}

export function CreatePoolForm({ tokenPrices = {} }: CreatePoolFormProps) {
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

  const sortedTokenAddresses = useMemo(() => {
    if (isMissingTokens) {
      return { tokenXAddress: tokenAAddress, tokenYAddress: tokenBAddress };
    }
    try {
      return sortSolanaAddresses(tokenAAddress, tokenBAddress);
    } catch (_error) {
      return { tokenXAddress: tokenAAddress, tokenYAddress: tokenBAddress };
    }
  }, [tokenAAddress, tokenBAddress, isMissingTokens]);

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const { data: poolDetails } = useQuery({
    ...tanstackClient.pools.getPoolDetails.queryOptions({
      input: {
        tokenXMint,
        tokenYMint,
      },
    }),
    enabled: Boolean(tokenXMint && tokenYMint),
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    staleTime: 60 * 1000,
  });

  const { data: tokenMetadataResponse } = useQuery({
    ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
      context: { cache: "force-cache" as RequestCache },
      input: {
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        filterBy: {
          case: "addressesList" as const,
          value: {
            $typeName: "darklake.v1.TokenAddressesList" as const,
            tokenAddresses: [tokenXMint, tokenYMint],
          },
        },
        pageNumber: 1,
        pageSize: 2,
      },
    }),
    enabled: Boolean(tokenXMint && tokenYMint),
    gcTime: 5 * 60 * 1000,
    queryKey: tanstackClient.dexGateway.getTokenMetadataList.queryKey({
      input: {
        $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
        filterBy: {
          case: "addressesList" as const,
          value: {
            $typeName: "darklake.v1.TokenAddressesList" as const,
            tokenAddresses: [tokenXMint, tokenYMint],
          },
        },
        pageNumber: 1,
        pageSize: 2,
      },
    }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    staleTime: 60 * 1000,
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

  const tokenADetails = tokenMetadataResponse?.tokens?.[0];
  const tokenBDetails = tokenMetadataResponse?.tokens?.[1];

  // If a pool already exists for the selected tokens, automatically switch to Add Liquidity.
  useEffect(() => {
    if (poolDetails && tokenAAddress && tokenBAddress) {
      const urlWithParams = serialize("liquidity", {
        tokenAAddress,
        tokenBAddress,
        type: LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY,
      });
      router.replace(`/${urlWithParams}`);
    }
  }, [poolDetails, tokenAAddress, tokenBAddress, router]);

  const { trackSigned, trackConfirmed } = useLiquidityTracking({
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

  const formConfig = {
    defaultValues: {
      initialPrice: "1",
      tokenAAmount: "0",
      tokenBAmount: "0",
    } satisfies LiquidityFormSchema,
    onSubmit: async () => {},
    validators: {
      onBlur: liquidityFormSchema,
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
        const newTrackingId = generateTrackingId();

        trackSigned({
          action: "add",
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
        });

        requestCreatePoolTransactionSigning({
          onSuccess: () => {
            createState.reset();
            form.reset();

            trackConfirmed({
              action: "add",
              amountA: tokenAAmount,
              amountB: tokenBAmount,
              tokenA: tokenAAddress || "",
              tokenB: tokenBAddress || "",
              transactionHash: newTrackingId,
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
          publicKey,
          setCreateStep: createState.setStep,
          showCreatePoolStepToast,
          signTransaction,
          toasts,
          tokenXMint: tokenXAddress,
          tokenYMint: tokenYAddress,
          trackingId: newTrackingId,
          unsignedTransaction: response.transaction,
          wallet,
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
              <SelectTokenButton
                prefetchEnabled={false}
                returnUrl="liquidity"
                type="sell"
              />
            </div>
            <form.Field
              listeners={{
                onChange: ({ value, fieldApi }) => {
                  const cleanValue = value.replace(/,/g, "");
                  const price = fieldApi.form.state.values.initialPrice || "1";

                  if (BigNumber(cleanValue).gt(0) && BigNumber(price).gt(0)) {
                    const calculatedTokenA =
                      initialPriceTokenOrder === "ab"
                        ? BigNumber(cleanValue).multipliedBy(price).toString()
                        : BigNumber(cleanValue).dividedBy(price).toString();
                    fieldApi.form.setFieldValue(
                      "tokenAAmount",
                      calculatedTokenA,
                    );
                  }
                },
              }}
              name="tokenBAmount"
              validators={{
                onChange: ({ value }) => {
                  return validateHasSufficientBalance({
                    amount: value,
                    tokenAccount: sellTokenAccount?.tokenAccounts[0],
                  });
                },
              }}
            >
              {(field) => (
                <FormFieldset
                  maxDecimals={5}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    field.handleChange(e.target.value);
                  }}
                  tokenAccount={sellTokenAccount?.tokenAccounts[0]}
                  tokenPrice={tokenBAddress ? tokenPrices[tokenBAddress] : null}
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
              <SelectTokenButton
                prefetchEnabled={false}
                returnUrl="liquidity"
                type="buy"
              />
            </div>
            <form.Field
              listeners={{
                onChange: ({ value, fieldApi }) => {
                  const cleanValue = value.replace(/,/g, "");
                  const price = fieldApi.form.state.values.initialPrice || "1";

                  if (BigNumber(cleanValue).gt(0) && BigNumber(price).gt(0)) {
                    const calculatedTokenB =
                      initialPriceTokenOrder === "ab"
                        ? BigNumber(cleanValue).dividedBy(price).toString()
                        : BigNumber(cleanValue).multipliedBy(price).toString();
                    fieldApi.form.setFieldValue(
                      "tokenBAmount",
                      calculatedTokenB,
                    );
                  }
                },
              }}
              name="tokenAAmount"
              validators={{
                onChange: ({ value }) => {
                  return validateHasSufficientBalance({
                    amount: value,
                    tokenAccount: buyTokenAccount?.tokenAccounts[0],
                  });
                },
              }}
            >
              {(field) => (
                <FormFieldset
                  maxDecimals={5}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    field.handleChange(e.target.value);
                  }}
                  tokenAccount={buyTokenAccount?.tokenAccounts[0]}
                  tokenPrice={tokenAAddress ? tokenPrices[tokenAAddress] : null}
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
                    {initialPriceTokenX?.logoUri ? (
                      <Image
                        alt={initialPriceTokenX?.symbol}
                        className="mr-2 size-6 overflow-hidden rounded-full"
                        height={24}
                        priority
                        src={initialPriceTokenX?.logoUri}
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
                <form.Field
                  listeners={{
                    onChange: ({ value, fieldApi }) => {
                      const tokenBAmount =
                        fieldApi.form.state.values.tokenBAmount.replace(
                          /,/g,
                          "",
                        );
                      if (
                        value &&
                        tokenBAmount &&
                        BigNumber(value).gt(0) &&
                        BigNumber(tokenBAmount).gt(0)
                      ) {
                        const calculatedTokenA =
                          initialPriceTokenOrder === "ab"
                            ? BigNumber(tokenBAmount)
                                .multipliedBy(value)
                                .toString()
                            : BigNumber(tokenBAmount)
                                .dividedBy(value)
                                .toString();

                        fieldApi.form.setFieldValue(
                          "tokenAAmount",
                          calculatedTokenA,
                        );
                      }
                    },
                  }}
                  name="initialPrice"
                >
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
