"use client";

import {
  convertToDecimal,
  formatAmountInput,
  parseAmountBigNumber,
} from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { FormFieldset } from "../../../_components/FormFieldset";
import {
  FORM_FIELD_NAMES,
  LIQUIDITY_CONSTANTS,
} from "../_constants/liquidityConstants";
import type {
  LiquidityFormValues,
  UseRealtimeTokenAccountsReturn,
} from "../_types/liquidity.types";
import { liquidityFormSchema } from "../_types/liquidity.types";

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {
    SwapFormFieldset: FormFieldset,
  },
  fieldContext,
  formComponents: {},
  formContext,
});

interface UseLiquidityFormStateOptions {
  readonly walletPublicKey: PublicKey | null;
  readonly tokenAccountsData: UseRealtimeTokenAccountsReturn;
  readonly onSubmit?: ({
    value,
  }: {
    value: LiquidityFormValues;
  }) => void | Promise<void>;
}

export function useLiquidityFormState({
  onSubmit,
  tokenAccountsData,
  walletPublicKey,
}: UseLiquidityFormStateOptions) {
  const defaultValues: LiquidityFormValues = {
    [FORM_FIELD_NAMES.INITIAL_PRICE]: LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
    [FORM_FIELD_NAMES.TOKEN_A_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
    [FORM_FIELD_NAMES.TOKEN_B_AMOUNT]: LIQUIDITY_CONSTANTS.DEFAULT_AMOUNT,
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }: { value: LiquidityFormValues }) => {
      if (onSubmit) await onSubmit({ value });
    },
    validators: {
      onChange: liquidityFormSchema,
      onDynamic: ({ value }: { value: LiquidityFormValues }) => {
        if (
          value.tokenAAmount &&
          walletPublicKey &&
          tokenAccountsData.buyTokenAccount?.tokenAccounts?.[0]
        ) {
          const tokenANumericValue = formatAmountInput(value.tokenAAmount);
          if (parseAmountBigNumber(tokenANumericValue).gt(0)) {
            const tokenAccount =
              tokenAccountsData.buyTokenAccount.tokenAccounts[0];
            const maxBalance = convertToDecimal(
              tokenAccount.amount || 0,
              tokenAccount.decimals || 0,
            );
            if (
              parseAmountBigNumber(tokenANumericValue).gt(maxBalance.toString())
            ) {
              const symbol = tokenAccount.symbol || "token";
              return { tokenAAmount: `Insufficient ${symbol} balance.` };
            }
          }
        }
      },
    },
  });

  return { form } as const;
}
