"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import type { CreatePoolTransactionInput, Token } from "@dex-web/orpc/schemas";
import { Box, Button, Icon, Text } from "@dex-web/ui";
import { convertToDecimal, numberFormatHelper } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSerializer, useQueryStates } from "nuqs";
import { useState } from "react";
import { z } from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { EMPTY_TOKEN, LIQUIDITY_PAGE_TYPE } from "../../../_utils/constants";
import { getExplorerUrl } from "../../../_utils/getExplorerUrl";
import {
  liquidityPageParsers,
  selectedTokensParsers,
} from "../../../_utils/searchParams";
import { sortSolanaAddresses } from "../../../_utils/sortSolanaAddresses";
import { dismissToast, toast } from "../../../_utils/toast";
import { getCreatePoolFormButtonMessage } from "../_utils/getCreatePoolFormButtonMessage";
import { validateHasSufficientBalance } from "../_utils/validateHasSufficientBalance";

export const { fieldContext, formContext } = createFormHookContexts();

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

export function CreatePoolForm() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const router = useRouter();
  const { trackLiquidity } = useAnalytics();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const [initialPriceTokenOrder, setInitialPriceDirection] = useState<
    "ab" | "ba"
  >("ab");
  const [createStep, setCreateStep] = useState(0);

  const isMissingTokens =
    tokenAAddress === EMPTY_TOKEN || tokenBAddress === EMPTY_TOKEN;

  const sortedTokenAddresses = isMissingTokens
    ? { tokenXAddress: tokenAAddress, tokenYAddress: tokenBAddress }
    : sortSolanaAddresses(tokenAAddress, tokenBAddress);

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const { data: poolDetails } = useSuspenseQuery(
    tanstackClient.pools.getPoolDetails.queryOptions({
      input: {
        tokenXMint,
        tokenYMint,
      },
    }),
  );

  const { data: buyTokenAccount, refetch: refetchBuyTokenAccount } = useQuery({
    ...tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: tokenAAddress,
        ownerAddress: publicKey?.toBase58() ?? "",
      },
    }),
    enabled: !!publicKey,
  });

  const { data: sellTokenAccount, refetch: refetchSellTokenAccount } = useQuery(
    {
      ...tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenBAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      }),
      enabled: !!publicKey,
    },
  );

  const { data: tokenMetadata } = useSuspenseQuery(
    tanstackClient.tokens.getTokenMetadata.queryOptions({
      input: {
        addresses: [tokenXMint, tokenYMint],
        returnAsObject: true,
      },
    }),
  );

  const metadata = tokenMetadata as Record<string, Token>;
  const tokenADetails = metadata[tokenXMint];
  const tokenBDetails = metadata[tokenYMint];

  const resetCreateState = () => {
    setCreateStep(0);
  };

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
      console.log(value);
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

  const requestCreatePoolSigning = async (
    unsignedTransaction: string,
    _trackingId: string,
  ) => {
    try {
      if (!publicKey) throw new Error("Wallet not connected!");
      if (!signTransaction)
        throw new Error("Wallet does not support transaction signing!");

      setCreateStep(2);
      toast({
        description:
          "Please confirm the pool creation transaction in your wallet.",
        title: "Confirm Pool Creation [2/3]",
        variant: "loading",
      });

      const transactionBuffer = Buffer.from(unsignedTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(transactionBuffer);
      const signedTransaction = await signTransaction(transaction);
      const signedTransactionBase64 = Buffer.from(
        signedTransaction.serialize(),
      ).toString("base64");

      const signedTxRequest = {
        signed_transaction: signedTransactionBase64,
      };

      setCreateStep(3);
      toast({
        description:
          "Processing your pool creation transaction on the blockchain.",
        title: "Creating Pool [3/3]",
        variant: "loading",
      });

      const poolTxResponse =
        await client.liquidity.submitLiquidityTransaction(signedTxRequest);

      if (poolTxResponse.success && poolTxResponse.signature) {
        checkLiquidityTransactionStatus(poolTxResponse.signature);
      } else {
        const errorMessage =
          poolTxResponse.error_logs || "Unknown error occurred";
        console.error("Pool transaction submission failed:", {
          error_logs: poolTxResponse.error_logs,
          success: poolTxResponse.success,
        });
        throw new Error(`Failed to create pool transaction: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Pool creation signing error:", error);
      dismissToast();
      toast({
        description: `${error instanceof Error ? error.message : "Unknown error occurred"}`,
        title: "Pool Creation Error",
        variant: "error",
      });
      resetCreateState();
    }
  };

  const handleCreatePool = async () => {
    if (!publicKey) {
      toast({
        description: "Please connect your wallet to create a pool",
        title: "Wallet Not Connected",
        variant: "error",
      });
      return;
    }

    if (isMissingTokens) {
      toast({
        description: "Please select both tokens",
        title: "Missing Tokens",
        variant: "error",
      });
      return;
    }

    const tokenAAmount = Number(
      form.state.values.tokenAAmount.replace(/,/g, ""),
    );
    const tokenBAmount = Number(
      form.state.values.tokenBAmount.replace(/,/g, ""),
    );
    const initialPrice = Number(form.state.values.initialPrice || "1");

    if (tokenAAmount <= 0 || tokenBAmount <= 0) {
      toast({
        description: "Please enter valid amounts for both tokens",
        title: "Invalid Amounts",
        variant: "error",
      });
      return;
    }

    if (initialPrice <= 0) {
      toast({
        description: "Please enter a valid initial price",
        title: "Invalid Price",
        variant: "error",
      });
      return;
    }

    try {
      setCreateStep(1);
      toast({
        description:
          "Preparing pool creation transaction. This may take a few seconds.",
        title: "Preparing Pool Creation [1/3]",
        variant: "loading",
      });

      if (!tokenAAddress || !tokenBAddress) {
        throw new Error("Missing token addresses");
      }

      if (!wallet) {
        throw new Error("Missing wallet");
      }

      const sortedTokens = sortSolanaAddresses(tokenAAddress, tokenBAddress);
      const { tokenXAddress, tokenYAddress } = sortedTokens;

      const isTokenASellToken = tokenBAddress === tokenXAddress;
      const depositAmountX = isTokenASellToken ? tokenAAmount : tokenBAmount;
      const depositAmountY = isTokenASellToken ? tokenBAmount : tokenAAmount;

      const response = await client.pools.createPoolTransaction({
        depositAmountX: Math.floor(depositAmountX),
        depositAmountY: Math.floor(depositAmountY),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      } satisfies CreatePoolTransactionInput);

      if (response.success && response.transaction) {
        await requestCreatePoolSigning(
          response.transaction,
          `pool-creation-${Date.now()}`,
        );
      } else {
        throw new Error("Failed to create pool transaction");
      }
    } catch (error) {
      console.error("Pool creation error:", error);
      dismissToast();
      toast({
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        title: "Pool Creation Error",
        variant: "error",
      });
      resetCreateState();
    }
  };

  const checkLiquidityTransactionStatus = async (
    signature: string,
    maxAttempts = 15,
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await client.liquidity.checkLiquidityTransactionStatus(
          {
            signature,
          },
        );

        if (response.status === "finalized") {
          if (response.error) {
            dismissToast();
            setCreateStep(0);
            toast({
              description: `Transaction failed: ${response.error}`,
              title: "Liquidity Transaction Failed",
              variant: "error",
            });

            // Track liquidity failed
            const tokenAAmount = Number(
              form.state.values.tokenAAmount.replace(/,/g, ""),
            );
            const tokenBAmount = Number(
              form.state.values.tokenBAmount.replace(/,/g, ""),
            );
            trackLiquidity({
              action: "add",
              amountA: tokenAAmount,
              amountB: tokenBAmount,
              status: "failed",
              tokenA: tokenAAddress || "",
              tokenB: tokenBAddress || "",
              transactionHash: signature,
            });

            return;
          } else {
            dismissToast();
            setCreateStep(0);

            // Track liquidity confirmed
            const tokenAAmount = Number(
              form.state.values.tokenAAmount.replace(/,/g, ""),
            );
            const tokenBAmount = Number(
              form.state.values.tokenBAmount.replace(/,/g, ""),
            );
            trackLiquidity({
              action: "add",
              amountA: tokenAAmount,
              amountB: tokenBAmount,
              status: "confirmed",
              tokenA: tokenAAddress || "",
              tokenB: tokenBAddress || "",
              transactionHash: signature,
            });

            toast({
              customAction: (
                <Text
                  as={Link}
                  className="inline-flex items-center gap-2 text-green-300 leading-none no-underline hover:text-green-200"
                  href={getExplorerUrl({ tx: signature })}
                  target="_blank"
                  variant="link"
                >
                  View Transaction{" "}
                  <Icon className="size-4" name="external-link" />
                </Text>
              ),
              description: (
                <div className="flex flex-col gap-1">
                  <Text.Body2>
                    ADDED LIQUIDITY: {form.state.values.tokenAAmount}{" "}
                    {tokenADetails?.symbol} + {form.state.values.tokenBAmount}{" "}
                    {tokenBDetails?.symbol}
                  </Text.Body2>
                </div>
              ),
              title: "Liquidity Added Successfully",
              variant: "success",
            });
            refetchBuyTokenAccount();
            refetchSellTokenAccount();
            return;
          }
        }

        if (response.status === "failed") {
          dismissToast();
          setCreateStep(0);
          toast({
            description: `Transaction failed: ${response.error || "Unknown error"}`,
            title: "Liquidity Transaction Failed",
            variant: "error",
          });
          return;
        }

        toast({
          description: `Finalizing transaction... (${i + 1}/${maxAttempts}) - ${response.status}`,
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
          setCreateStep(0);
          toast({
            description: `Unable to confirm transaction status. Check your wallet or explorer with signature: ${signature}`,
            title: "Transaction Status Unknown",
            variant: "error",
          });
        }
      }
    }

    dismissToast();
    setCreateStep(0);
    toast({
      description: `Transaction may still be processing. Check explorer with signature: ${signature}`,
      title: "Transaction Status Timeout",
      variant: "error",
    });
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
        // If displaying price as "A per B", then tokenAAmount = tokenBAmount * price
        calculatedTokenA = BigNumber(tokenBAmount)
          .multipliedBy(price)
          .toString();
      } else {
        // If displaying price as "B per A", then tokenAAmount = tokenBAmount / price
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
          initialPriceTokenOrder === "ba"
            ? BigNumber(value).dividedBy(price).toString()
            : BigNumber(value).multipliedBy(price).toString();
        form.setFieldValue("tokenAAmount", calculatedTokenA);
      }
    } else {
      if (BigNumber(value).gt(0) && BigNumber(price).gt(0)) {
        const calculatedTokenB =
          initialPriceTokenOrder === "ba"
            ? BigNumber(value).multipliedBy(price).toString()
            : BigNumber(value).dividedBy(price).toString();
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

  const serialize = createSerializer(liquidityPageParsers);
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
                additionalParams={{ type: LIQUIDITY_PAGE_TYPE.CREATE_POOL }}
                returnUrl="liquidity"
                type="sell"
              />
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
              <SelectTokenButton
                additionalParams={{ type: LIQUIDITY_PAGE_TYPE.CREATE_POOL }}
                returnUrl="liquidity"
                type="buy"
              />
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
              <ConnectWalletButton className="w-full py-3" />
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
                Pool already exists, please go to liquidity page
              </Button>
            ) : (
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Button
                    className="w-full cursor-pointer py-3 leading-6"
                    disabled={
                      isMissingTokens ||
                      !form.state.canSubmit ||
                      createStep !== 0
                    }
                    loading={createStep !== 0}
                    onClick={handleCreatePool}
                  >
                    {getCreatePoolFormButtonMessage({
                      buyTokenAccount,
                      createStep,
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
          {(values) => (
            <>
              {!poolDetails &&
                values.tokenAAmount !== "0" &&
                values.tokenBAmount !== "0" && (
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
                            value: values.tokenAAmount,
                          })}{" "}
                          {buyTokenAccount?.tokenAccounts[0]?.symbol}
                        </Text.Body2>
                        <Text.Body2 className="text-green-200">
                          {numberFormatHelper({
                            decimalScale: 5,
                            trimTrailingZeros: true,
                            value: values.tokenBAmount,
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
          )}
        </form.Subscribe>
      </Box>
      <div className="size-9" />
    </section>
  );
}
