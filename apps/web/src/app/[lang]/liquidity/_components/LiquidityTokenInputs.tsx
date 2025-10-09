"use client";

import type { GetTokenPriceOutput } from "@dex-web/orpc/schemas/index";
import { Box, Icon, Text } from "@dex-web/ui";
import {
  formatAmountInput,
  parseAmountBigNumber,
  validateHasSufficientBalance,
} from "@dex-web/utils";
import { Field } from "@tanstack/react-form";
import { useRef } from "react";
import { FormFieldset } from "../../../_components/FormFieldset";
import { SelectTokenButton } from "../../../_components/SelectTokenButton";
import { SkeletonTokenInput } from "../../../_components/SkeletonTokenInput";
import { FORM_FIELD_NAMES } from "../_constants/liquidityConstants";
import type { LiquidityFormApi } from "../_hooks/useLiquidityFormState";
import type { PoolDetails, TokenAccountsData } from "../_types/liquidity.types";

const MAX_DECIMALS = 5;
const DEFAULT_PRICE = "1";

interface LiquidityTokenInputsProps {
  form: LiquidityFormApi;
  buyTokenAccount?: TokenAccountsData | null;
  sellTokenAccount?: TokenAccountsData | null;
  isLoadingBuy: boolean;
  isLoadingSell: boolean;
  isRefreshingBuy: boolean;
  isRefreshingSell: boolean;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  poolDetails: PoolDetails | null;
  calculateProportionalAmount: (params: {
    inputAmount: string;
    editedToken: "tokenA" | "tokenB";
    tokenAAddress: string;
    tokenBAddress: string;
  }) => number | null;
  /**
   * Token prices to avoid suspense waterfall in FormFieldset
   */
  tokenPrices?: Record<string, GetTokenPriceOutput | undefined>;
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
  calculateProportionalAmount,
  tokenPrices = {},
}: LiquidityTokenInputsProps) {
  const isUpdatingRef = useRef(false);

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
            listeners={{
              onChange: ({ value, fieldApi }) => {
                if (typeof value !== "string") return;

                if (isUpdatingRef.current) return;

                const formattedValue = formatAmountInput(value);

                if (
                  poolDetails &&
                  parseAmountBigNumber(formattedValue).gt(0) &&
                  _tokenAAddress &&
                  _tokenBAddress
                ) {
                  const output = calculateProportionalAmount({
                    editedToken: "tokenB",
                    inputAmount: formattedValue,
                    tokenAAddress: _tokenAAddress,
                    tokenBAddress: _tokenBAddress,
                  });

                  if (output != null) {
                    const targetDecimals =
                      buyTokenAccount?.tokenAccounts?.[0]?.decimals ??
                      MAX_DECIMALS;
                    const preciseDecimals = Math.min(
                      targetDecimals,
                      MAX_DECIMALS,
                    );

                    let finalOutput = output.toFixed(preciseDecimals);
                    finalOutput = finalOutput.replace(/\.?0+$/, "");

                    isUpdatingRef.current = true;
                    fieldApi.form.setFieldValue(
                      FORM_FIELD_NAMES.TOKEN_A_AMOUNT,
                      finalOutput,
                    );
                    Promise.resolve().then(() => {
                      isUpdatingRef.current = false;
                    });
                  }
                }
              },
            }}
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
                  field.handleChange(e.target.value);
                }}
                tokenAccount={
                  sellTokenAccount?.tokenAccounts?.[0]
                    ? {
                        ...sellTokenAccount.tokenAccounts[0],
                        address:
                          sellTokenAccount.tokenAccounts[0].address || "",
                      }
                    : undefined
                }
                tokenPrice={
                  _tokenBAddress ? tokenPrices[_tokenBAddress] : undefined
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
            listeners={{
              onChange: ({ value, fieldApi }) => {
                if (typeof value !== "string") return;

                if (isUpdatingRef.current) return;

                const formattedValue = formatAmountInput(value);

                if (
                  poolDetails &&
                  parseAmountBigNumber(formattedValue).gt(0) &&
                  _tokenAAddress &&
                  _tokenBAddress
                ) {
                  const output = calculateProportionalAmount({
                    editedToken: "tokenA",
                    inputAmount: formattedValue,
                    tokenAAddress: _tokenAAddress,
                    tokenBAddress: _tokenBAddress,
                  });

                  if (output != null) {
                    const targetDecimals =
                      sellTokenAccount?.tokenAccounts?.[0]?.decimals ??
                      MAX_DECIMALS;
                    const preciseDecimals = Math.min(
                      targetDecimals,
                      MAX_DECIMALS,
                    );

                    let finalOutput = output.toFixed(preciseDecimals);
                    finalOutput = finalOutput.replace(/\.?0+$/, "");

                    isUpdatingRef.current = true;
                    fieldApi.form.setFieldValue(
                      FORM_FIELD_NAMES.TOKEN_B_AMOUNT,
                      finalOutput,
                    );
                    Promise.resolve().then(() => {
                      isUpdatingRef.current = false;
                    });
                  }
                } else if (
                  !poolDetails &&
                  parseAmountBigNumber(formattedValue).gt(0)
                ) {
                  const price =
                    fieldApi.form.state.values.initialPrice || DEFAULT_PRICE;
                  if (parseAmountBigNumber(price).gt(0)) {
                    const calculatedTokenB = parseAmountBigNumber(
                      formattedValue,
                    )
                      .multipliedBy(price)
                      .toString();

                    isUpdatingRef.current = true;
                    fieldApi.form.setFieldValue(
                      FORM_FIELD_NAMES.TOKEN_B_AMOUNT,
                      calculatedTokenB,
                    );
                    Promise.resolve().then(() => {
                      isUpdatingRef.current = false;
                    });
                  }
                }
              },
            }}
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
                  field.handleChange(e.target.value);
                }}
                tokenAccount={
                  buyTokenAccount?.tokenAccounts?.[0]
                    ? {
                        ...buyTokenAccount.tokenAccounts[0],
                        address: buyTokenAccount.tokenAccounts[0].address || "",
                      }
                    : undefined
                }
                tokenPrice={
                  _tokenAAddress ? tokenPrices[_tokenAAddress] : undefined
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
