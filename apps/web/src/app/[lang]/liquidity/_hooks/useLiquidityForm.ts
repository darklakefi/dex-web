"use client";

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use `useLiquidityFormState` from "./useLiquidityFormState" instead.
 *
 * Reason: Replaced by useLiquidityFormState which follows the conductor pattern
 * and properly separates concerns between TanStack Form, TanStack Query, and XState.
 *
 * Migration: Replace usages with useLiquidityFormState and adjust props accordingly.
 */

import {
  convertToDecimal,
  formatAmountInput,
  parseAmountBigNumber,
  validateHasSufficientBalance,
} from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
  FORM_FIELD_NAMES,
  LIQUIDITY_CONSTANTS,
} from "../_constants/liquidityConstants";

interface TokenAccountData {
  tokenAccounts?: Array<{
    address: string;
    amount: number;
    decimals: number;
    symbol: string;
  }>;
}

interface UseLiquidityFormProps {
  publicKey: PublicKey | null;
  buyTokenAccount: TokenAccountData | undefined;
  onSubmit: (values: LiquidityFormValues) => Promise<void>;
}

const liquidityFormSchema = z.object({
  [FORM_FIELD_NAMES.INITIAL_PRICE]: z.string(),
  [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: z.string(),
  [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: z.string(),
});

export type LiquidityFormValues = z.infer<typeof liquidityFormSchema>;

export const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  } as const,
  fieldContext,
  formComponents: {} as const,
  formContext,
});

/**
 * @deprecated Use useLiquidityFormState instead
 */
export function useLiquidityForm({
  publicKey,
  buyTokenAccount,
  onSubmit,
}: UseLiquidityFormProps) {
  const formConfig = useMemo(
    () => ({
      defaultValues: {
        [FORM_FIELD_NAMES.INITIAL_PRICE]:
          LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
        [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
        [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
      } as LiquidityFormValues,
      onSubmit: async ({ value }: { value: LiquidityFormValues }) => {
        await onSubmit(value);
      },
      validators: {
        onBlur: liquidityFormSchema,
        onDynamic: ({ value }: { value: LiquidityFormValues }) => {
          if (
            value[FORM_FIELD_NAMES.TOKEN_A_AMOUNT] &&
            publicKey &&
            buyTokenAccount?.tokenAccounts?.[0]
          ) {
            const tokenANumericValue = formatAmountInput(
              value[FORM_FIELD_NAMES.TOKEN_A_AMOUNT],
            );
            if (parseAmountBigNumber(tokenANumericValue).gt(0)) {
              const tokenAccount = buyTokenAccount.tokenAccounts[0];
              const maxBalance = convertToDecimal(
                tokenAccount.amount || 0,
                tokenAccount.decimals || 0,
              );

              if (
                parseAmountBigNumber(tokenANumericValue).gt(
                  maxBalance.toString(),
                )
              ) {
                const symbol = tokenAccount.symbol || "token";
                return {
                  [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: `Insufficient ${symbol} balance.`,
                };
              }
            }
          }
        },
      },
    }),
    [publicKey, buyTokenAccount, onSubmit],
  );

  const form = useAppForm(formConfig);

  const resetFormToDefaults = useCallback((): void => {
    form.setFieldValue(
      FORM_FIELD_NAMES.TOKEN_A_AMOUNT,
      LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
    );
    form.setFieldValue(
      FORM_FIELD_NAMES.TOKEN_B_AMOUNT,
      LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
    );
    form.setFieldValue(
      FORM_FIELD_NAMES.INITIAL_PRICE,
      LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
    );
  }, [form]);

  const validateSufficientBalance = useCallback(
    (
      amount: string,
      tokenAccount?: TokenAccountData["tokenAccounts"] extends (infer U)[]
        ? U
        : never,
    ): string | undefined => {
      return validateHasSufficientBalance({
        amount,
        tokenAccount,
      });
    },
    [],
  );

  return {
    fieldContext,
    form,
    formContext,
    resetFormToDefaults,
    validateSufficientBalance,
  };
}
