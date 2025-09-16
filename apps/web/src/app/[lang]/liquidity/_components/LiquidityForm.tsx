"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import type {
  CreateLiquidityTransactionInput,
  CreatePoolTransactionInput,
  Token,
} from "@dex-web/orpc/schemas";
import { Box, Button, Icon, Text } from "@dex-web/ui";
import { convertToDecimal } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { useAnalytics } from "../../../../hooks/useAnalytics";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { TokenTransactionSettingsButton } from "../../../_components/TokenTransactionSettingsButton";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../_utils/constants";
import { getExplorerUrl } from "../../../_utils/getExplorerUrl";
import { isSquadsX } from "../../../_utils/isSquadsX";
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { sortSolanaAddresses } from "../../../_utils/sortSolanaAddresses";
import { dismissToast, toast } from "../../../_utils/toast";
import { getLiquidityFormButtonMessage } from "../_utils/getLiquidityFormButtonMessage";
import { requestLiquidityTransactionSigning } from "../_utils/requestLiquidityTransactionSigning";
import { validateHasSufficientBalance } from "../_utils/validateHasSufficientBalance";
import { AddLiquidityDetails } from "./AddLiquidityDetail";

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

export function LiquidityForm() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const { trackLiquidity, trackError } = useAnalytics();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers
  );

  const tx = useTranslations("liquidity");

  const [initialPriceTokenOrder, setInitialPriceDirection] = useState<
    "ab" | "ba"
  >("ab");
  const [liquidityStep, setLiquidityStep] = useState(0);
  const [createStep, setCreateStep] = useState(0);
  const [disableLiquidity, setDisableLiquidity] = useState(true);
  const [slippage, setSlippage] = useState("0.5");

  const sortedTokenAddresses = sortSolanaAddresses(
    tokenAAddress,
    tokenBAddress
  );

  const tokenXMint = sortedTokenAddresses.tokenXAddress;
  const tokenYMint = sortedTokenAddresses.tokenYAddress;

  const { data: poolDetails } = useSuspenseQuery(
    tanstackClient.pools.getPoolDetails.queryOptions({
      input: {
        tokenXMint,
        tokenYMint,
      },
    })
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
    }
  );

  const { data: tokenMetadata } = useSuspenseQuery(
    tanstackClient.tokens.getTokenMetadata.queryOptions({
      input: {
        addresses: [tokenXMint, tokenYMint],
        returnAsObject: true,
      },
    })
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
              tokenAccount.decimals || 0
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
    transaction: Transaction,
    _trackingId: string
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

      await signTransaction(transaction);

      setCreateStep(3);
      toast({
        description:
          "Processing your pool creation transaction on the blockchain.",
        title: "Creating Pool [3/3]",
        variant: "loading",
      });

      setTimeout(() => {
        dismissToast();
        const squads = isSquadsX(wallet);
        toast({
          description: squads
            ? tx("squadsX.responseStatus.confirmed.description")
            : `Pool created successfully! Token A: ${form.state.values.tokenAAmount}, Token B: ${form.state.values.tokenBAmount}`,
          title: squads
            ? tx("squadsX.responseStatus.confirmed.title")
            : "Pool Created",
          variant: "success",
        });
        resetCreateState();
        refetchBuyTokenAccount();
        refetchSellTokenAccount();
      }, 2000);
    } catch (error) {
      console.error("Pool creation signing error:", error);
      dismissToast();
      const squads = isSquadsX(wallet);
      toast({
        description: squads
          ? tx("squadsX.responseStatus.failed.description")
          : `${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
        title: squads
          ? tx("squadsX.responseStatus.failed.title")
          : "Pool Creation Error",
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

    const tokenAAmount = Number(
      form.state.values.tokenAAmount.replace(/,/g, "")
    );
    const tokenBAmount = Number(
      form.state.values.tokenBAmount.replace(/,/g, "")
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
        tokenXProgramId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        tokenYMint: tokenYAddress,
        tokenYProgramId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        user: publicKey.toBase58(),
      } satisfies CreatePoolTransactionInput);

      if (response.success && response.transaction) {
        const transactionBuffer = Buffer.from(response.transaction, "base64");
        const transaction = Transaction.from(transactionBuffer);

        await requestCreatePoolSigning(
          transaction,
          `pool-creation-${Date.now()}`
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
    maxAttempts = 15
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await client.liquidity.checkLiquidityTransactionStatus(
          {
            signature,
          }
        );

        if (response.status === "finalized") {
          if (response.error) {
            dismissToast();
            setLiquidityStep(0);
            const squads = isSquadsX(wallet);
            toast({
              description: squads
                ? `Transaction failed in Squads. Please review the proposal in the Squads app.`
                : `Transaction failed: ${response.error}`,
              title: squads
                ? "Proposal failed"
                : "Liquidity Transaction Failed",
              variant: "error",
            });

            const tokenAAmount = Number(
              form.state.values.tokenAAmount.replace(/,/g, "")
            );
            const tokenBAmount = Number(
              form.state.values.tokenBAmount.replace(/,/g, "")
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
            setLiquidityStep(0);

            const tokenAAmount = Number(
              form.state.values.tokenAAmount.replace(/,/g, "")
            );
            const tokenBAmount = Number(
              form.state.values.tokenBAmount.replace(/,/g, "")
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

            const squads = isSquadsX(wallet);
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
                    {squads
                      ? `Transaction initiated. You can now cast votes for this proposal on the Squads app.`
                      : `ADDED LIQUIDITY: ${form.state.values.tokenAAmount} ${tokenBAddress} + ${form.state.values.tokenBAmount} ${tokenAAddress}. Transaction: ${signature}`}
                  </Text.Body2>
                </div>
              ),

              title: squads
                ? "Proposal created"
                : "Liquidity Added Successfully",
              variant: "success",
            });
            refetchBuyTokenAccount();
            refetchSellTokenAccount();
            return;
          }
        }

        if (response.status === "failed") {
          dismissToast();
          setLiquidityStep(0);
          const squads = isSquadsX(wallet);
          toast({
            description: squads
              ? `Transaction failed in Squads. Please review the proposal in the Squads app.`
              : `Transaction failed: ${response.error || "Unknown error"}`,
            title: squads ? "Proposal failed" : "Liquidity Transaction Failed",
            variant: "error",
          });
          return;
        }

        toast({
          description: `Finalizing transaction... (${i + 1}/${maxAttempts}) - ${
            response.status
          }`,
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

    const tokenAAmount = Number(
      form.state.values.tokenAAmount.replace(/,/g, "")
    );
    const tokenBAmount = Number(
      form.state.values.tokenBAmount.replace(/,/g, "")
    );
    trackLiquidity({
      action: "add",
      amountA: tokenAAmount,
      amountB: tokenBAmount,
      status: "initiated",
      tokenA: tokenAAddress || "",
      tokenB: tokenBAddress || "",
    });

    try {
      const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
      const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

      const sortedTokens = sortSolanaAddresses(
        finalTokenAAddress,
        finalTokenBAddress
      );

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      if (!wallet) {
        throw new Error("Missing wallet");
      }

      if (!tokenXAddress || !tokenYAddress) {
        throw new Error("Invalid token addresses after sorting");
      }

      const sellAmount = Number(
        form.state.values.tokenBAmount.replace(/,/g, "")
      );
      const buyAmount = Number(
        form.state.values.tokenAAmount.replace(/,/g, "")
      );

      const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      const requestPayload = {
        maxAmountX: maxAmountX,
        maxAmountY: maxAmountY,
        slippage: Number(slippage || "0.5"),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      } satisfies CreateLiquidityTransactionInput;

      const response = await client.liquidity.createLiquidityTransaction(
        requestPayload
      );

      if (response.success && response.transaction) {
        trackLiquidity({
          action: "add",
          amountA: buyAmount,
          amountB: sellAmount,
          status: "signed",
          tokenA: tokenAAddress || "",
          tokenB: tokenBAddress || "",
        });

        requestLiquidityTransactionSigning({
          checkLiquidityTransactionStatus,
          publicKey,
          setLiquidityStep,
          signTransaction,
          unsignedTransaction: response.transaction,
        });
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

      trackError({
        context: "liquidity_add",
        details: {
          amountA: form.state.values.tokenAAmount,
          amountB: form.state.values.tokenBAmount,
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      });

      setLiquidityStep(0);
    }
  };

  const calculateTokenAmounts = async ({
    inputAmount,
    inputType,
  }: {
    inputAmount: string;
    inputType: "tokenX" | "tokenY";
  }) => {
    const amountNumber = Number(inputAmount.replace(/,/g, ""));
    if (!poolDetails || BigNumber(amountNumber).lte(0)) return;

    setLiquidityStep(10);
    setDisableLiquidity(true);

    const response = await client.liquidity.getAddLiquidityReview({
      isTokenX: inputType === "tokenX",
      tokenAmount: amountNumber,
      tokenXMint: poolDetails.tokenXMint,
      tokenYMint: poolDetails.tokenYMint,
    });

    if (inputType === "tokenX") {
      form.setFieldValue("tokenBAmount", String(response.tokenAmount));
      form.validateAllFields("change");
    } else {
      form.setFieldValue("tokenAAmount", String(response.tokenAmount));
      form.validateAllFields("change");
    }

    setDisableLiquidity(false);
    setLiquidityStep(0);
  };

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    500
  );

  const handleInitialPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value;
    const tokenAAmount = form.state.values.tokenAAmount.replace(/,/g, "");

    if (
      price &&
      tokenAAmount &&
      BigNumber(price).gt(0) &&
      BigNumber(tokenAAmount).gt(0)
    ) {
      const calculatedTokenB = BigNumber(tokenAAmount)
        .multipliedBy(price)
        .toString();
      form.setFieldValue("tokenBAmount", calculatedTokenB);
    }
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell"
  ) => {
    const value = e.target.value.replace(/,/g, "");

    if (poolDetails && BigNumber(value).gt(0)) {
      const inputType =
        (type === "sell" && poolDetails?.tokenXMint === tokenBAddress) ||
        (type === "buy" && poolDetails?.tokenXMint === tokenAAddress)
          ? "tokenX"
          : "tokenY";

      debouncedCalculateTokenAmounts({
        inputAmount: value,
        inputType,
      });
    } else if (!poolDetails) {
      if (type === "buy") {
        const price = form.state.values.initialPrice || "1";
        if (BigNumber(value).gt(0) && BigNumber(price).gt(0)) {
          const calculatedTokenB = BigNumber(value)
            .multipliedBy(price)
            .toString();
          form.setFieldValue("tokenBAmount", calculatedTokenB);
        }
      }
    } else {
      setDisableLiquidity(true);
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
                AMOUNT
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
                AMOUNT
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
          {!poolDetails && (
            <div>
              <Text.Body2 className="mb-2 text-green-100">
                Your selection will create a new liquidity pool
              </Text.Body2>
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
                          onClick={() =>
                            setInitialPriceDirection(
                              initialPriceTokenOrder === "ab" ? "ba" : "ab"
                            )
                          }
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
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    className="w-full cursor-pointer py-3 leading-6"
                    disabled={
                      liquidityStep !== 0 ||
                      disableLiquidity ||
                      !form.state.canSubmit ||
                      isSubmitting ||
                      !canSubmit
                    }
                    loading={liquidityStep !== 0}
                    onClick={handleDeposit}
                  >
                    {getLiquidityFormButtonMessage({
                      buyTokenAccount,
                      createStep,
                      initialPrice: form.state.values.initialPrice,
                      liquidityStep,
                      poolDetails,
                      publicKey,
                      sellTokenAccount,
                      tokenAAddress,
                      tokenAAmount: form.state.values.tokenAAmount,
                      tokenBAddress,
                      tokenBAmount: form.state.values.tokenBAmount,
                    })}
                  </Button>
                )}
              </form.Subscribe>
            ) : (
              <Button
                className="w-full cursor-pointer py-3 leading-6"
                disabled={!form.state.canSubmit || createStep !== 0}
                loading={createStep !== 0}
                onClick={handleCreatePool}
              >
                {getLiquidityFormButtonMessage({
                  buyTokenAccount,
                  createStep,
                  initialPrice: form.state.values.initialPrice,
                  liquidityStep,
                  poolDetails,
                  publicKey,
                  sellTokenAccount,
                  tokenAAddress,
                  tokenAAmount: form.state.values.tokenAAmount,
                  tokenBAddress,
                  tokenBAmount: form.state.values.tokenBAmount,
                })}
              </Button>
            )}
          </div>
        </div>
        {poolDetails &&
          form.state.values.tokenBAmount !== "0" &&
          form.state.values.tokenAAmount !== "0" && (
            <AddLiquidityDetails
              slippage={slippage}
              tokenAAmount={form.state.values.tokenAAmount}
              tokenASymbol={buyTokenAccount?.tokenAccounts[0]?.symbol || ""}
              tokenBAmount={form.state.values.tokenBAmount}
              tokenBSymbol={sellTokenAccount?.tokenAccounts[0]?.symbol || ""}
            />
          )}

        {!poolDetails &&
          form.state.values.tokenAAmount !== "0" &&
          form.state.values.tokenBAmount !== "0" &&
          form.state.values.initialPrice !== "1" && (
            <div className="mt-4 space-y-3 border-green-600 border-t pt-4">
              <Text.Body2 className="mb-3 text-green-300 uppercase">
                Pool Creation Summary
              </Text.Body2>

              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Initial Deposit
                </Text.Body3>
                <div className="text-right">
                  <Text.Body3 className="text-green-200">
                    {form.state.values.tokenAAmount}{" "}
                    {buyTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                  <Text.Body3 className="text-green-200">
                    {form.state.values.tokenBAmount}{" "}
                    {sellTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Initial Price
                </Text.Body3>
                <Text.Body3 className="text-green-200">
                  1 {buyTokenAccount?.tokenAccounts[0]?.symbol} ={" "}
                  {form.state.values.initialPrice}{" "}
                  {sellTokenAccount?.tokenAccounts[0]?.symbol}
                </Text.Body3>
              </div>

              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Your Pool Share
                </Text.Body3>
                <Text.Body3 className="text-green-200">100%</Text.Body3>
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
