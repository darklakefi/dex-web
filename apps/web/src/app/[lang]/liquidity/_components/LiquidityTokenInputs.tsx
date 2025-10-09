"use client";

import { Box, Icon, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  formatAmountInput,
  parseAmountBigNumber,
  validateHasSufficientBalance,
} from "@dex-web/utils";
import { Field, type FormApi } from "@tanstack/react-form";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { SkeletonTokenInput } from "../../../_components/SkeletonTokenInput";
import { FORM_FIELD_NAMES } from "../_constants/liquidityConstants";
import type {
  LiquidityFormValues,
  PoolDetails,
  TokenAccountsData,
} from "../_types/liquidity.types";

const MAX_DECIMALS = 5;
const DEFAULT_PRICE = "1";

interface LiquidityTokenInputsProps {
  // Use specific FormApi type for better type safety
  form: FormApi<LiquidityFormValues, unknown>;
  buyTokenAccount?: TokenAccountsData | null;
  sellTokenAccount?: TokenAccountsData | null;
  isLoadingBuy: boolean;
  isLoadingSell: boolean;
  isRefreshingBuy: boolean;
  isRefreshingSell: boolean;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  poolDetails: PoolDetails | null;
  onSubmit?: () => void;
  calculateProportionalAmount: (params: {
    inputAmount: string;
    editedToken: "tokenA" | "tokenB";
    tokenAAddress: string;
    tokenBAddress: string;
  }) => number | null;
  // Disable inputs when workflow is in a final state (success/error)
  // UI state should always reflect application logical state
  isDisabled?: boolean;
}

export function LiquidityTokenInputs({
  form,
  buyTokenAccount,
  sellTokenAccount,
  isLoadingBuy,
  isLoadingSell,
  isRefreshingBuy,
  isRefreshingSell,
  tokenAAddress: _tokenAAddress,
  tokenBAddress: _tokenBAddress,
  poolDetails,
  onSubmit: _onSubmit,
  calculateProportionalAmount,
  isDisabled = false,
}: LiquidityTokenInputsProps) {
  const handleHalfMaxClick = (
    type: "half" | "max",
    tokenType: "tokenA" | "tokenB",
  ) => {
    const currentTokenAccount =
      tokenType === "tokenA" ? buyTokenAccount : sellTokenAccount;

    if (!currentTokenAccount?.tokenAccounts?.[0]) return;
    if (!_tokenAAddress || !_tokenBAddress) return;

    const currentAmount = currentTokenAccount.tokenAccounts[0].amount;
    const currentDecimals = currentTokenAccount.tokenAccounts[0].decimals;

    const currentValue =
      type === "half"
        ? convertToDecimal(currentAmount, currentDecimals)
            .div(2)
            .toFixed(MAX_DECIMALS)
            .toString()
        : convertToDecimal(currentAmount, currentDecimals)
            .toFixed(MAX_DECIMALS)
            .toString();

    if (poolDetails && parseAmountBigNumber(currentValue).gt(0)) {
      const currentFieldName =
        tokenType === "tokenA"
          ? FORM_FIELD_NAMES.TOKEN_A_AMOUNT
          : FORM_FIELD_NAMES.TOKEN_B_AMOUNT;

      form.setFieldValue(currentFieldName, currentValue);

      const output = calculateProportionalAmount({
        editedToken: tokenType,
        inputAmount: currentValue,
        tokenAAddress: _tokenAAddress,
        tokenBAddress: _tokenBAddress,
      });

      if (output != null) {
        const targetField =
          tokenType === "tokenA"
            ? FORM_FIELD_NAMES.TOKEN_B_AMOUNT
            : FORM_FIELD_NAMES.TOKEN_A_AMOUNT;
        form.setFieldValue(targetField, String(output));
        form.validateAllFields("change");
      }
    }
  };

  const handleAmountChange = (
    value: string,
    tokenType: "tokenA" | "tokenB",
  ) => {
    const formattedValue = formatAmountInput(value);

    if (
      poolDetails &&
      parseAmountBigNumber(formattedValue).gt(0) &&
      _tokenAAddress &&
      _tokenBAddress
    ) {
      const output = calculateProportionalAmount({
        editedToken: tokenType,
        inputAmount: formattedValue,
        tokenAAddress: _tokenAAddress,
        tokenBAddress: _tokenBAddress,
      });

      if (output != null) {
        const targetField =
          tokenType === "tokenA"
            ? FORM_FIELD_NAMES.TOKEN_B_AMOUNT
            : FORM_FIELD_NAMES.TOKEN_A_AMOUNT;
        form.setFieldValue(targetField, String(output));
        form.validateAllFields("change");
      }
    } else if (!poolDetails) {
      if (tokenType === "tokenA") {
        const price = form.state.values.initialPrice || DEFAULT_PRICE;
        if (
          parseAmountBigNumber(formattedValue).gt(0) &&
          parseAmountBigNumber(price).gt(0)
        ) {
          const calculatedTokenB = parseAmountBigNumber(formattedValue)
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
      {isLoadingSell && !sellTokenAccount ? (
        <SkeletonTokenInput label="TOKEN" />
      ) : (
        <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
          <div>
            <Text.Body2
              as="label"
              className="mb-3 block text-green-300 uppercase"
              id="sell-token-label"
            >
              TOKEN
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
              onChange: ({ value }: { value: unknown }) => {
                if (typeof value !== "string") return undefined;

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
                isLoading={isLoadingSell}
                isRefreshing={isRefreshingSell}
                maxDecimals={MAX_DECIMALS}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  handleAmountChange(value, "tokenB");
                  field.handleChange(value);
                }}
                onHalfMaxClick={(type) => handleHalfMaxClick(type, "tokenB")}
                tokenAccount={
                  sellTokenAccount?.tokenAccounts?.[0]
                    ? {
                        ...sellTokenAccount.tokenAccounts[0],
                        address:
                          sellTokenAccount.tokenAccounts[0].address || "",
                      }
                    : undefined
                }
                value={
                  typeof field.state.value === "string" ? field.state.value : ""
                }
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

      {isLoadingBuy && !buyTokenAccount ? (
        <SkeletonTokenInput label="TOKEN" />
      ) : (
        <Box className="flex-row border border-green-400 bg-green-600 pt-3 pb-3 hover:border-green-300">
          <div>
            <Text.Body2
              as="label"
              className="mb-3 block text-green-300 uppercase"
              id="buy-token-label"
            >
              TOKEN
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
              onChange: ({ value }: { value: unknown }) => {
                if (typeof value !== "string") return undefined;

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
                isLoading={isLoadingBuy}
                isRefreshing={isRefreshingBuy}
                maxDecimals={MAX_DECIMALS}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  handleAmountChange(value, "tokenA");
                  field.handleChange(value);
                }}
                onHalfMaxClick={(type) => handleHalfMaxClick(type, "tokenA")}
                tokenAccount={
                  buyTokenAccount?.tokenAccounts?.[0]
                    ? {
                        ...buyTokenAccount.tokenAccounts[0],
                        address: buyTokenAccount.tokenAccounts[0].address || "",
                      }
                    : undefined
                }
                value={
                  typeof field.state.value === "string" ? field.state.value : ""
                }
              />
            )}
          </Field>
        </Box>
      )}
    </fieldset>
  );
}
