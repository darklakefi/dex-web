"use client";

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
  readonly onSubmit: ({
    value,
  }: {
    value: LiquidityFormValues;
  }) => void | Promise<void>;
}

/**
 * TanStack Form state management for liquidity forms.
 *
 * Following Answer #3: Form validates → XState executes
 * The form's responsibility ends when the user clicks submit and data is valid.
 * After that, XState takes over the submission workflow.
 */
export function useLiquidityFormState({
  onSubmit,
  tokenAccountsData,
  walletPublicKey,
}: UseLiquidityFormStateOptions) {
  const defaultValues: LiquidityFormValues = {
    [FORM_FIELD_NAMES.INITIAL_PRICE]: LIQUIDITY_CONSTANTS.DEFAULT_INITIAL_PRICE,
    [FORM_FIELD_NAMES.SLIPPAGE]: LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
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
    },
  });

  return { form } as const;
}
