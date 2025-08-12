"use client";

import { client, tanstackClient } from "@dex-web/orpc";
import type { CreatePoolTxInput } from "@dex-web/orpc/schemas";
import { Box, Button, Text, TextInput } from "@dex-web/ui";
import { convertToDecimal } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { z } from "zod";
import { ConnectWalletButton } from "../../../_components/ConnectWalletButton";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { selectedTokensParsers } from "../../../_utils/searchParams";
import { sortSolanaAddresses } from "../../../_utils/sortSolanaAddresses";
import { dismissToast, toast } from "../../../_utils/toast";

export const { fieldContext, formContext } = createFormHookContexts();

const createPoolFormSchema = z.object({
  initialPrice: z.string(),
  tokenAAmount: z.string(),
  tokenBAmount: z.string(),
});

type CreatePoolFormSchema = z.infer<typeof createPoolFormSchema>;

const { useAppForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {},
  formContext,
});

const formConfig = {
  defaultValues: {
    initialPrice: "1",
    tokenAAmount: "0",
    tokenBAmount: "0",
  } satisfies CreatePoolFormSchema,
  onSubmit: async ({ value }: { value: CreatePoolFormSchema }) => {
    console.log(value);
  },
  validators: {
    onChange: createPoolFormSchema,
  },
};

const BUTTON_MESSAGE = {
  CREATE_POOL: "Create Pool",
  ENTER_AMOUNTS: "Enter token amounts",
  INSUFFICIENT_BALANCE: "Insufficient",
  INVALID_PRICE: "Invalid price",
  LOADING: "Loading",
  POOL_EXISTS: "Pool already exists",
  SAME_TOKENS: "Select different tokens",
  STEP_1: "Preparing pool creation [1/3]",
  STEP_2: "Confirm transaction in your wallet [2/3]",
  STEP_3: "Processing pool creation [3/3]",
};

export function CreatePoolForm() {
  const form = useAppForm(formConfig);
  const { publicKey, wallet, signTransaction } = useWallet();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const [createStep, setCreateStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInsufficientBalanceA, setIsInsufficientBalanceA] = useState(false);
  const [isInsufficientBalanceB, setIsInsufficientBalanceB] = useState(false);

  const { data: tokenAAccount, refetch: refetchTokenAAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenBAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      }),
    );

  const { data: tokenBAccount, refetch: refetchTokenBAccount } =
    useSuspenseQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: {
          mint: tokenAAddress,
          ownerAddress: publicKey?.toBase58() ?? "",
        },
      }),
    );

  // Check if pool exists
  const { data: existingPool } = useSuspenseQuery(
    tanstackClient.getPoolDetails.queryOptions({
      input: {
        tokenXMint: tokenBAddress,
        tokenYMint: tokenAAddress,
      },
    }),
  );

  const resetState = () => {
    setCreateStep(0);
    setIsLoading(false);
  };

  const checkInsufficientBalance = (
    input: string,
    type: "tokenA" | "tokenB",
  ) => {
    const value = input.replace(/,/g, "");
    const tokenAccount = type === "tokenA" ? tokenAAccount : tokenBAccount;
    const accountAmount = tokenAccount?.tokenAccounts[0]?.amount || 0;
    const decimal = tokenAccount?.tokenAccounts[0]?.decimals || 0;

    if (BigNumber(value).gt(convertToDecimal(accountAmount, decimal))) {
      if (type === "tokenA") {
        setIsInsufficientBalanceA(true);
      } else {
        setIsInsufficientBalanceB(true);
      }
      return true;
    }

    if (type === "tokenA") {
      setIsInsufficientBalanceA(false);
    } else {
      setIsInsufficientBalanceB(false);
    }
    return false;
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "tokenA" | "tokenB",
  ) => {
    const value = e.target.value.replace(/,/g, "");
    checkInsufficientBalance(value, type);
  };

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
      checkInsufficientBalance(calculatedTokenB, "tokenB");
    }
  };

  const requestSigning = async (
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

      // Here you would submit the signed transaction to the blockchain
      // For now, we'll simulate success
      setTimeout(() => {
        dismissToast();
        toast({
          description: `Pool created successfully! Token A: ${form.state.values.tokenAAmount}, Token B: ${form.state.values.tokenBAmount}`,
          title: "Pool Created",
          variant: "success",
        });
        resetState();
        refetchTokenAAccount();
        refetchTokenBAccount();
      }, 2000);
    } catch (error) {
      console.error("Signing error:", error);
      dismissToast();
      toast({
        description: `${error instanceof Error ? error.message : "Unknown error occurred"}`,
        title: "Pool Creation Error",
        variant: "error",
      });
      resetState();
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
    const initialPrice = Number(form.state.values.initialPrice);

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
      setIsLoading(true);
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

      // Determine which token is X and which is Y based on sorted addresses
      const isTokenASellToken = tokenBAddress === tokenXAddress;
      const depositAmountX = isTokenASellToken ? tokenAAmount : tokenBAmount;
      const depositAmountY = isTokenASellToken ? tokenBAmount : tokenAAmount;

      const response = await client.createPoolTx({
        depositAmountX: Math.floor(depositAmountX),
        depositAmountY: Math.floor(depositAmountY),
        tokenXMint: tokenXAddress, // Standard SPL token program
        tokenXProgramId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        tokenYMint: tokenYAddress,
        tokenYProgramId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        user: publicKey.toBase58(),
      } satisfies CreatePoolTxInput);

      if (response.success && response.transaction) {
        // Deserialize the base64 transaction string back to a Transaction object
        const transactionBuffer = Buffer.from(response.transaction, "base64");
        const transaction = Transaction.from(transactionBuffer);

        await requestSigning(transaction, `pool-creation-${Date.now()}`);
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
      resetState();
    }
  };

  const getButtonMessage = () => {
    if (createStep === 1) return BUTTON_MESSAGE.STEP_1;
    if (createStep === 2) return BUTTON_MESSAGE.STEP_2;
    if (createStep === 3) return BUTTON_MESSAGE.STEP_3;

    // Check if same tokens are selected
    if (tokenBAddress === tokenAAddress) {
      return BUTTON_MESSAGE.SAME_TOKENS;
    }

    // Check if pool already exists
    if (existingPool?.tokenXMint && existingPool.tokenYMint) {
      return BUTTON_MESSAGE.POOL_EXISTS;
    }

    const tokenAAmount = form.state.values.tokenAAmount.replace(/,/g, "");
    const tokenBAmount = form.state.values.tokenBAmount.replace(/,/g, "");
    const initialPrice = form.state.values.initialPrice;

    if (
      !tokenAAmount ||
      BigNumber(tokenAAmount).lte(0) ||
      !tokenBAmount ||
      BigNumber(tokenBAmount).lte(0)
    ) {
      return BUTTON_MESSAGE.ENTER_AMOUNTS;
    }

    if (!initialPrice || BigNumber(initialPrice).lte(0)) {
      return BUTTON_MESSAGE.INVALID_PRICE;
    }

    if (isInsufficientBalanceA) {
      const symbol = tokenAAccount?.tokenAccounts[0]?.symbol || "";
      return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
    }

    if (isInsufficientBalanceB) {
      const symbol = tokenBAccount?.tokenAccounts[0]?.symbol || "";
      return `${BUTTON_MESSAGE.INSUFFICIENT_BALANCE} ${symbol}`;
    }

    return BUTTON_MESSAGE.CREATE_POOL;
  };

  const isFormValid = () => {
    const tokenAAmount = form.state.values.tokenAAmount.replace(/,/g, "");
    const tokenBAmount = form.state.values.tokenBAmount.replace(/,/g, "");
    const initialPrice = form.state.values.initialPrice;

    return (
      tokenBAddress !== tokenAAddress && // Different tokens
      !(existingPool?.tokenXMint && existingPool.tokenYMint) && // Pool doesn't exist
      BigNumber(tokenAAmount).gt(0) &&
      BigNumber(tokenBAmount).gt(0) &&
      BigNumber(initialPrice).gt(0) &&
      !isInsufficientBalanceA &&
      !isInsufficientBalanceB &&
      createStep === 0
    );
  };

  return (
    <section className="flex w-full max-w-xl items-start gap-1">
      <div className="size-9" />
      <Box padding="lg">
        <div className="flex flex-col gap-4">
          {/* Token A Input */}
          <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
            <div>
              <Text.Body2
                as="label"
                className="mb-3 block text-green-300 uppercase"
              >
                Token A Amount
              </Text.Body2>
              <SelectTokenButton returnUrl="create-pool" type="sell" />
            </div>
            <form.Field name="tokenAAmount">
              {(field) => (
                <FormFieldset
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleAmountChange(e, "tokenA");
                    field.handleChange(e.target.value);
                  }}
                  tokenAccount={tokenAAccount?.tokenAccounts[0]}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </Box>

          {/* Initial Price Input */}
          <Box className="border border-green-400 bg-green-600 p-4 hover:border-green-300">
            <Text.Body2
              as="label"
              className="mb-3 block text-green-300 uppercase"
            >
              Initial Price (Token B per Token A)
            </Text.Body2>
            <form.Field name="initialPrice">
              {(field) => (
                <TextInput
                  className="w-full border border-green-500 bg-green-700 text-white placeholder:text-green-300"
                  label="Initial Price"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleInitialPriceChange(e);
                    field.handleChange(e.target.value);
                  }}
                  placeholder="1.0"
                  step="any"
                  type="number"
                  value={field.state.value}
                />
              )}
            </form.Field>
            <Text.Body3 className="mt-2 text-green-300">
              This sets how many Token B equals 1 Token A
            </Text.Body3>
          </Box>

          {/* Token B Input */}
          <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
            <div>
              <Text.Body2
                as="label"
                className="mb-3 block text-green-300 uppercase"
              >
                Token B Amount
              </Text.Body2>
              <SelectTokenButton returnUrl="create-pool" type="buy" />
            </div>
            <form.Field name="tokenBAmount">
              {(field) => (
                <FormFieldset
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleAmountChange(e, "tokenB");
                    field.handleChange(e.target.value);
                  }}
                  tokenAccount={tokenBAccount?.tokenAccounts[0]}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </Box>

          {/* Create Pool Button */}
          <div className="w-full">
            {!publicKey ? (
              <ConnectWalletButton className="w-full py-3" />
            ) : (
              <Button
                className="w-full cursor-pointer py-3"
                disabled={!isFormValid()}
                loading={isLoading}
                onClick={handleCreatePool}
              >
                {getButtonMessage()}
              </Button>
            )}
          </div>
        </div>

        {/* Pool Creation Summary */}
        {form.state.values.tokenAAmount !== "0" &&
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
                    {tokenAAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                  <Text.Body3 className="text-white">
                    {form.state.values.tokenBAmount}{" "}
                    {tokenBAccount?.tokenAccounts[0]?.symbol}
                  </Text.Body3>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Text.Body3 className="text-green-300">
                  Initial Price
                </Text.Body3>
                <Text.Body3 className="text-white">
                  1 {tokenAAccount?.tokenAccounts[0]?.symbol} ={" "}
                  {form.state.values.initialPrice}{" "}
                  {tokenBAccount?.tokenAccounts[0]?.symbol}
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
      <div className="size-9" />
    </section>
  );
}
