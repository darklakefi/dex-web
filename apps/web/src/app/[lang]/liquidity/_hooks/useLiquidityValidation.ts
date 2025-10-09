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
  buyTokenAccount?: TokenAccountsData | null;
  sellTokenAccount?: TokenAccountsData | null;
  poolDetails: PoolDetails | null;
  tokenAAddress: string;
  tokenBAddress: string;
  hasWallet: boolean;
}

export function useLiquidityValidation({
  formValues,
  buyTokenAccount,
  sellTokenAccount,
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
      const sellTokenAcc = sellTokenAccount?.tokenAccounts?.[0];
      if (sellTokenAcc) {
        if (
          exceedsBalance(
            sellAmount,
            sellTokenAcc.amount || 0,
            sellTokenAcc.decimals || 0,
          )
        ) {
          errors.tokenBAmount = `Insufficient ${sellTokenAcc.symbol || "token"} balance`;
          hasInsufficientBalance = true;
        }
      }
    }

    if (hasWallet && buyAmount && BigNumber(buyAmount).gt(0)) {
      const buyTokenAcc = buyTokenAccount?.tokenAccounts?.[0];
      if (buyTokenAcc) {
        if (
          exceedsBalance(
            buyAmount,
            buyTokenAcc.amount || 0,
            buyTokenAcc.decimals || 0,
          )
        ) {
          errors.tokenAAmount = `Insufficient ${buyTokenAcc.symbol || "token"} balance`;
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
    buyTokenAccount,
    sellTokenAccount,
    poolDetails,
    tokenAAddress,
    tokenBAddress,
    hasWallet,
  ]);
}
