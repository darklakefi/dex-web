"use client";

import { exceedsBalance } from "@dex-web/utils";
import BigNumber from "bignumber.js";
import { useMemo } from "react";
import type {
  LiquidityFormValues,
  PoolDetails,
  TokenAccountsData,
} from "../_types/liquidity.types";

export interface ValidationState {
  errors: {
    tokenAAmount?: string;
    tokenBAmount?: string;
    initialPrice?: string;
    general?: string;
  };
  isValid: boolean;
  hasInsufficientBalance: boolean;
  hasAmounts: boolean;
  canSubmit: boolean;
}

export interface ValidationProps {
  formValues: LiquidityFormValues;
  tokenAAccount?: TokenAccountsData | null;
  tokenBAccount?: TokenAccountsData | null;
  poolDetails: PoolDetails | null;
  tokenAAddress: string;
  tokenBAddress: string;
  hasWallet: boolean;
}

export function useLiquidityValidation({
  formValues,
  tokenAAccount,
  tokenBAccount,
  poolDetails,
  tokenAAddress,
  tokenBAddress,
  hasWallet,
}: ValidationProps): ValidationState {
  return useMemo(() => {
    const errors: ValidationState["errors"] = {};

    const sellAmount = formValues.tokenBAmount.replace(/,/g, "");
    const buyAmount = formValues.tokenAAmount.replace(/,/g, "");
    const initialPrice = formValues.initialPrice;

    if (tokenAAddress === tokenBAddress) {
      errors.general = "Select different tokens";
    }

    const hasAmounts = Boolean(
      sellAmount &&
        BigNumber(sellAmount).gt(0) &&
        buyAmount &&
        BigNumber(buyAmount).gt(0),
    );

    let hasInsufficientBalance = false;

    if (hasWallet && sellAmount && BigNumber(sellAmount).gt(0)) {
      const tokenBAcc = tokenBAccount?.tokenAccounts?.[0];
      if (tokenBAcc) {
        if (
          exceedsBalance(
            sellAmount,
            tokenBAcc.amount || 0,
            tokenBAcc.decimals || 0,
          )
        ) {
          errors.tokenBAmount = `Insufficient ${tokenBAcc.symbol || "token"} balance`;
          hasInsufficientBalance = true;
        }
      }
    }

    if (hasWallet && buyAmount && BigNumber(buyAmount).gt(0)) {
      const tokenAAcc = tokenAAccount?.tokenAccounts?.[0];
      if (tokenAAcc) {
        if (
          exceedsBalance(
            buyAmount,
            tokenAAcc.amount || 0,
            tokenAAcc.decimals || 0,
          )
        ) {
          errors.tokenAAmount = `Insufficient ${tokenAAcc.symbol || "token"} balance`;
          hasInsufficientBalance = true;
        }
      }
    }

    if (!poolDetails && (!initialPrice || BigNumber(initialPrice).lte(0))) {
      errors.initialPrice = "Invalid price";
    }

    const isValid = Object.keys(errors).length === 0;
    const canSubmit =
      isValid && hasAmounts && hasWallet && !hasInsufficientBalance;

    return {
      canSubmit,
      errors,
      hasAmounts,
      hasInsufficientBalance,
      isValid,
    };
  }, [
    formValues,
    tokenAAccount,
    tokenBAccount,
    poolDetails,
    tokenAAddress,
    tokenBAddress,
    hasWallet,
  ]);
}
