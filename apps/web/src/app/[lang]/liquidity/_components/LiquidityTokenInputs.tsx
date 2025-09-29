"use client";

import { Box, Icon, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  formatAmountInput,
  parseAmountBigNumber,
  validateHasSufficientBalance,
} from "@dex-web/utils";
import { Field } from "@tanstack/react-form";
import { useDebouncedCallback } from "use-debounce";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { SkeletonTokenInput } from "../../../_components/SkeletonTokenInput";
import { FORM_FIELD_NAMES } from "../_constants/liquidityConstants";
import { useLiquidityCalculations } from "../_hooks/useLiquidityCalculations";
import type { PoolDetails, TokenAccountsData } from "../_types/liquidity.types";
import { useLiquidityForm } from "./LiquidityContexts";

interface LiquidityTokenInputsProps {
  buyTokenAccount?: TokenAccountsData | null;
  sellTokenAccount?: TokenAccountsData | null;
  isLoadingBuy: boolean;
  isLoadingSell: boolean;
  isRefreshingBuy: boolean;
  isRefreshingSell: boolean;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  poolDetails: PoolDetails | null;
}

export function LiquidityTokenInputs({
  buyTokenAccount,
  sellTokenAccount,
  isLoadingBuy,
  isLoadingSell,
  isRefreshingBuy,
  isRefreshingSell,
  tokenAAddress,
  tokenBAddress,
  poolDetails,
}: LiquidityTokenInputsProps) {
  const { form } = useLiquidityForm();
  const { calculate, clearCalculations, isCalculating } =
    useLiquidityCalculations();

  const debouncedCalculateTokenAmounts = useDebouncedCallback(
    async ({
      inputAmount,
      inputType,
    }: {
      inputAmount: string;
      inputType: "tokenX" | "tokenY";
    }) => {
      if (!poolDetails || !tokenAAddress || !tokenBAddress) return;

      const result = await calculate({
        inputAmount,
        inputType,
        tokenXMint: poolDetails.tokenXMint,
        tokenYMint: poolDetails.tokenYMint,
      });

      if (result) {
        if (inputType === "tokenX") {
          form.setFieldValue(
            FORM_FIELD_NAMES.TOKEN_B_AMOUNT,
            String(result.tokenAmount),
          );
        } else {
          form.setFieldValue(
            FORM_FIELD_NAMES.TOKEN_A_AMOUNT,
            String(result.tokenAmount),
          );
        }
        form.validateAllFields("change");
      }
    },
    200,
  );

  const clearPendingCalculations = () => {
    debouncedCalculateTokenAmounts.cancel();
    clearCalculations();
  };

  const handleHalfMaxClick = (
    type: "half" | "max",
    currentField: "sell" | "buy",
  ) => {
    const currentTokenAccount =
      currentField === "sell" ? sellTokenAccount : buyTokenAccount;

    if (!currentTokenAccount?.tokenAccounts?.[0]) return;

    const currentAmount = currentTokenAccount.tokenAccounts[0].amount;
    const currentDecimals = currentTokenAccount.tokenAccounts[0].decimals;

    const currentValue =
      type === "half"
        ? convertToDecimal(currentAmount, currentDecimals)
            .div(2)
            .toFixed(5)
            .toString()
        : convertToDecimal(currentAmount, currentDecimals)
            .toFixed(5)
            .toString();

    const currentFieldName =
      currentField === "sell"
        ? FORM_FIELD_NAMES.TOKEN_B_AMOUNT
        : FORM_FIELD_NAMES.TOKEN_A_AMOUNT;

    form.setFieldValue(currentFieldName, currentValue);

    if (poolDetails && parseAmountBigNumber(currentValue).gt(0)) {
      const inputType =
        (currentField === "sell" &&
          poolDetails?.tokenXMint === tokenBAddress) ||
        (currentField === "buy" && poolDetails?.tokenXMint === tokenAAddress)
          ? "tokenX"
          : "tokenY";

      debouncedCalculateTokenAmounts({
        inputAmount: currentValue,
        inputType,
      });
    }
  };

  const handleAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "buy" | "sell",
  ) => {
    const value = formatAmountInput(e.target.value);

    clearPendingCalculations();

    if (e.isTrusted && poolDetails && parseAmountBigNumber(value).gt(0)) {
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
        if (
          parseAmountBigNumber(value).gt(0) &&
          parseAmountBigNumber(price).gt(0)
        ) {
          const calculatedTokenB = parseAmountBigNumber(value)
            .multipliedBy(price)
            .toString();
          form.setFieldValue(FORM_FIELD_NAMES.TOKEN_B_AMOUNT, calculatedTokenB);
        }
      }
    }
  };

  return (
    <fieldset
      aria-labelledby="liquidity-inputs-heading"
      className="flex flex-col gap-4"
    >
      {(isLoadingSell && !sellTokenAccount) || !sellTokenAccount ? (
        <SkeletonTokenInput label="SELL AMOUNT" />
      ) : (
        <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
          <div>
            <Text.Body2
              as="label"
              className="mb-3 block text-green-300 uppercase"
              id="sell-token-label"
            >
              SELL AMOUNT
            </Text.Body2>
            <SelectTokenButton
              aria-describedby="sell-token-label"
              returnUrl="liquidity"
              type="sell"
            />
          </div>
          <Field
            form={form}
            name={FORM_FIELD_NAMES.TOKEN_B_AMOUNT}
            validators={{
              onChange: ({ value }: { value: string }) => {
                const balanceValidation = validateHasSufficientBalance({
                  amount: value,
                  tokenAccount: sellTokenAccount?.tokenAccounts?.[0],
                });

                if (balanceValidation) return balanceValidation;

                if (value && parseAmountBigNumber(value).isNaN()) {
                  return "Please enter a valid number";
                }

                return undefined;
              },
              onChangeListenTo: [FORM_FIELD_NAMES.TOKEN_A_AMOUNT],
            }}
          >
            {(field) => (
              <FormFieldset
                aria-describedby={
                  field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                aria-labelledby="sell-token-label"
                isLoading={isLoadingSell || isCalculating}
                isRefreshing={isRefreshingSell}
                maxDecimals={5}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const formattedValue = formatAmountInput(e.target.value);
                  handleAmountChange(e, "sell");
                  field.handleChange(formattedValue);
                }}
                onClearPendingCalculations={clearPendingCalculations}
                onHalfMaxClick={(type) => handleHalfMaxClick(type, "sell")}
                tokenAccount={
                  sellTokenAccount?.tokenAccounts?.[0]
                    ? {
                        ...sellTokenAccount.tokenAccounts[0],
                        address:
                          sellTokenAccount.tokenAccounts[0].address || "",
                      }
                    : undefined
                }
                value={field.state.value}
              />
            )}
          </Field>
        </Box>
      )}

      <div className="flex items-center justify-center">
        <div
          aria-label="Plus - Adding liquidity to pool"
          className="inline-flex size-8 items-center justify-center border border-green-600 bg-green-800 p-1 text-green-300"
          role="img"
        >
          <Icon className="size-5" name="plus" />
        </div>
      </div>

      {(isLoadingBuy && !buyTokenAccount) || !buyTokenAccount ? (
        <SkeletonTokenInput label="BUY AMOUNT" />
      ) : (
        <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
          <div>
            <Text.Body2
              as="label"
              className="mb-3 block text-green-300 uppercase"
              id="buy-token-label"
            >
              BUY AMOUNT
            </Text.Body2>
            <SelectTokenButton
              aria-describedby="buy-token-label"
              returnUrl="liquidity"
              type="buy"
            />
          </div>
          <Field
            form={form}
            name={FORM_FIELD_NAMES.TOKEN_A_AMOUNT}
            validators={{
              onChange: ({ value }: { value: string }) => {
                const balanceValidation = validateHasSufficientBalance({
                  amount: value,
                  tokenAccount: buyTokenAccount?.tokenAccounts?.[0],
                });

                if (balanceValidation) return balanceValidation;

                if (value && parseAmountBigNumber(value).isNaN()) {
                  return "Please enter a valid number";
                }

                return undefined;
              },
              onChangeListenTo: [FORM_FIELD_NAMES.TOKEN_B_AMOUNT],
            }}
          >
            {(field) => (
              <FormFieldset
                aria-describedby={
                  field.state.meta.errors.length > 0
                    ? `${field.name}-error`
                    : undefined
                }
                aria-labelledby="buy-token-label"
                isLoading={isLoadingBuy || isCalculating}
                isRefreshing={isRefreshingBuy}
                maxDecimals={5}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const formattedValue = formatAmountInput(e.target.value);
                  handleAmountChange(e, "buy");
                  field.handleChange(formattedValue);
                }}
                onClearPendingCalculations={clearPendingCalculations}
                onHalfMaxClick={(type) => handleHalfMaxClick(type, "buy")}
                tokenAccount={
                  buyTokenAccount?.tokenAccounts?.[0]
                    ? {
                        ...buyTokenAccount.tokenAccounts[0],
                        address: buyTokenAccount.tokenAccounts[0].address || "",
                      }
                    : undefined
                }
                value={field.state.value}
              />
            )}
          </Field>
        </Box>
      )}
    </fieldset>
  );
}
