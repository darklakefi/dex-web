"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import type {
  AddLiquidityTxInput,
  CreatePoolTxInput,
} from "@dex-web/orpc/schemas";
import { Box, Button, Icon, Text } from "@dex-web/ui";
import { convertToDecimal, numberFormatHelper } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import Image from "next/image";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
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
  initialPrice: z.string(),
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
  },
};

const BUTTON_MESSAGE = {
  ADD_LIQUIDITY: "Add Liquidity",
  CALCULATING: "calculating amounts...",
  CREATE_POOL: "Create Pool",
  CREATE_STEP_1: "Preparing pool creation [1/3]",
  CREATE_STEP_2: "Confirm transaction in your wallet [2/3]",
  CREATE_STEP_3: "Processing pool creation [3/3]",
  ENTER_AMOUNT: "enter an amount",
  ENTER_AMOUNTS: "Enter token amounts",
  INSUFFICIENT_BALANCE: "insufficient",
  INVALID_PRICE: "Invalid price",
  LOADING: "loading",
  SAME_TOKENS: "Select different tokens",
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

  const [initialPriceTokenOrder, setInitialPriceDirection] = useState<
    "ab" | "ba"
  >("ab");
  const [liquidityStep, setLiquidityStep] = useState(0);
  const [createStep, setCreateStep] = useState(0);
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

  const [lpRate, setLpRate] = useState(0);
  const [poolPrice, setPoolPrice] = useState(0);

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

  const resetCreateState = () => {
    setCreateStep(0);
  };

  const requestCreatePoolSigning = async (
    transaction: Transaction,
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
        toast({
          description: `Pool created successfully! Token A: ${form.state.values.tokenAAmount}, Token B: ${form.state.values.tokenBAmount}`,
          title: "Pool Created",
          variant: "success",
        });
        resetCreateState();
        refetchBuyTokenAccount();
        refetchSellTokenAccount();
      }, 2000);
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

      const response = await client.createPoolTx({
        depositAmountX: Math.floor(depositAmountX),
        depositAmountY: Math.floor(depositAmountY),
        tokenXMint: tokenXAddress,
        tokenXProgramId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        tokenYMint: tokenYAddress,
        tokenYProgramId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        user: publicKey.toBase58(),
      } satisfies CreatePoolTxInput);

      if (response.success && response.transaction) {
        const transactionBuffer = Buffer.from(response.transaction, "base64");
        const transaction = Transaction.from(transactionBuffer);

        await requestCreatePoolSigning(
          transaction,
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
            dismissToast();
            setLiquidityStep(0);
            toast({
              description: `Transaction failed: ${response.error}, trackingId: ${trackingId}`,
              title: "Liquidity Transaction Failed",
              variant: "error",
            });
            return;
          } else {
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
          dismissToast();
          setLiquidityStep(0);
          toast({
            description: `Transaction failed: ${response.error || "Unknown error"}, trackingId: ${trackingId}`,
            title: "Liquidity Transaction Failed",
            variant: "error",
          });
          return;
        }

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

      const minLpTokens = 1;

      console.log("Liquidity calculation:", {
        isTokenXSell,
        maxAmountX,
        maxAmountY,
        minLpTokens,
        slippage,
        tokenXAddress,
        tokenYAddress,
      });

      const requestPayload = {
        lpTokensToMint: minLpTokens,
        maxAmountX: maxAmountX,
        maxAmountY: maxAmountY,
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

    const response = await client.getAddLiquidityReview({
      isTokenX: inputType === "tokenX",
      tokenAmount: amountNumber,
      tokenXMint: poolDetails.tokenXMint,
      tokenYMint: poolDetails.tokenYMint,
    });

    // const lpRate = await client.getLPRate({
    //   slippage: Number(slippage || "0.5"),
    //   tokenXAmount:
    //     inputType === "tokenX" ? amountNumber : response.tokenAmount,
    //   tokenXMint: poolDetails.tokenXMint,
    //   tokenYAmount:
    //     inputType === "tokenY" ? amountNumber : response.tokenAmount,
    //   tokenYMint: poolDetails.tokenYMint,
    // });

    const oneXtoY =
      inputType === "tokenX"
        ? BigNumber(amountNumber).dividedBy(response.tokenAmount)
        : BigNumber(response.tokenAmount).dividedBy(amountNumber);

    setPoolPrice(oneXtoY.toNumber());

    if (inputType === "tokenX") {
      form.setFieldValue("tokenBAmount", String(response.tokenAmount));
    } else {
      form.setFieldValue("tokenAAmount", String(response.tokenAmount));
    }

    // setLpRate(lpRate.estimatedLPTokens);
    setDisableLiquidity(false);
    setLiquidityStep(0);
  };

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    calculateTokenAmounts,
    500,
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
      checkInsufficientBalance(calculatedTokenB, "sell");
    }
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = e.target.value.replace(/,/g, "");

    const hasInsufficientBalance = checkInsufficientBalance(value, type);

    if (poolDetails && BigNumber(value).gt(0) && !hasInsufficientBalance) {
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
          checkInsufficientBalance(calculatedTokenB, "sell");
        }
      }
    } else {
      setDisableLiquidity(true);
    }
  };

  const getButtonMessage = () => {
    const sellAmount = form.state.values.tokenBAmount.replace(/,/g, "");
    const buyAmount = form.state.values.tokenAAmount.replace(/,/g, "");
    const initialPrice = form.state.values.initialPrice;

    if (createStep === 1) return BUTTON_MESSAGE.CREATE_STEP_1;
    if (createStep === 2) return BUTTON_MESSAGE.CREATE_STEP_2;
    if (createStep === 3) return BUTTON_MESSAGE.CREATE_STEP_3;

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

    if (tokenBAddress === tokenAAddress) {
      return BUTTON_MESSAGE.SAME_TOKENS;
    }

    if (!poolDetails) {
      if (
        !sellAmount ||
        BigNumber(sellAmount).lte(0) ||
        !buyAmount ||
        BigNumber(buyAmount).lte(0)
      ) {
        return BUTTON_MESSAGE.ENTER_AMOUNTS;
      }

      if (!initialPrice || BigNumber(initialPrice).lte(0)) {
        return BUTTON_MESSAGE.INVALID_PRICE;
      }

      if (isInsufficientBalanceSell) {
        const symbol = sellTokenAccount?.tokenAccounts[0]?.symbol || "";
        return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
      }

      if (isInsufficientBalanceBuy) {
        const symbol = buyTokenAccount?.tokenAccounts[0]?.symbol || "";
        return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
      }

      return BUTTON_MESSAGE.CREATE_POOL;
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

  const isCreateFormValid = () => {
    const sellAmount = form.state.values.tokenBAmount.replace(/,/g, "");
    const buyAmount = form.state.values.tokenAAmount.replace(/,/g, "");
    const initialPrice = form.state.values.initialPrice;

    return (
      tokenBAddress !== tokenAAddress &&
      BigNumber(sellAmount).gt(0) &&
      BigNumber(buyAmount).gt(0) &&
      BigNumber(initialPrice || "0").gt(0) &&
      !isInsufficientBalanceSell &&
      !isInsufficientBalanceBuy &&
      createStep === 0
    );
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
            <div className="inline-flex items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300">
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
                    {initialPriceTokenX.imageUrl ? (
                      <Image
                        alt={initialPriceTokenX.symbol}
                        className="mr-2 size-6 overflow-hidden rounded-full"
                        height={24}
                        priority
                        src={initialPriceTokenX.imageUrl}
                        unoptimized
                        width={24}
                      />
                    ) : (
                      <Icon className="mr-2 fill-green-200" name="seedlings" />
                    )}
                    <Text.Body2 className="text-green-200 text-lg">
                      1 {initialPriceTokenX.symbol} =
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
                              initialPriceTokenOrder === "ab" ? "ba" : "ab",
                            )
                          }
                          type="button"
                        >
                          <Icon className="rotate-90" name="swap" />
                        </button>
                      }
                      currencyCode={initialPriceTokenY.symbol}
                      exchangeRate={poolRatio}
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
                disabled={!isCreateFormValid()}
                loading={createStep !== 0}
                onClick={handleCreatePool}
              >
                {getButtonMessage()}
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

              <div className="flex items-center justify-between">
                <Text.Body2 className="text-green-300">
                  Total Deposit
                </Text.Body2>
                <div className="text-right">
                  <Text.Body2 className="text-green-300">
                    {form.state.values.tokenBAmount}{" "}
                    {sellTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body2>
                  <Text.Body2 className="text-green-300">
                    {form.state.values.tokenAAmount}{" "}
                    {buyTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body2>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Text.Body2 className="text-green-300">Pool Price</Text.Body2>
                <Text.Body2 className="text-green-300">
                  1 {sellTokenAccount?.tokenAccounts[0]?.symbol} ={" "}
                  {numberFormatHelper({
                    decimalScale: 6,
                    trimTrailingZeros: true,
                    value: poolPrice,
                  })}{" "}
                  {buyTokenAccount?.tokenAccounts[0]?.symbol}
                </Text.Body2>
              </div>

              {/* <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">Pool Share</Text.Body3>
                <Text.Body3 className="text-white">
                  ~0.01%{" "}
                </Text.Body3>
              </div> */}

              {/* <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Est. Fee (24h)
                </Text.Body3>
                <Text.Body3 className="text-green-400">
                  $0.24{" "}
                </Text.Body3>
              </div> */}

              <div className="flex items-center justify-between">
                <Text.Body2 className="text-green-300">
                  Slippage Tolerance
                </Text.Body2>
                <Text.Body2 className="text-green-300">{slippage}%</Text.Body2>
              </div>
            </div>
          )}

        {/* Pool Creation Summary - only shown when pool doesn't exist */}
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
                  <Text.Body3 className="text-white">
                    {form.state.values.tokenAAmount}{" "}
                    {buyTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                  <Text.Body3 className="text-white">
                    {form.state.values.tokenBAmount}{" "}
                    {sellTokenAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Initial Price
                </Text.Body3>
                <Text.Body3 className="text-white">
                  1 {buyTokenAccount?.tokenAccounts[0]?.symbol} ={" "}
                  {form.state.values.initialPrice}{" "}
                  {sellTokenAccount?.tokenAccounts[0]?.symbol}
                </Text.Body3>
              </div>

              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Your Pool Share
                </Text.Body3>
                <Text.Body3 className="text-white">100%</Text.Body3>
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
