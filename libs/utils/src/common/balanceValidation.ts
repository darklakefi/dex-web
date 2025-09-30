import { convertToDecimal } from "../number";
import { formatAmountInput, parseAmountBigNumber } from "./amountUtils";
import Decimal from "decimal.js";

export interface TokenAccount {
  amount?: number;
  decimals?: number;
  symbol?: string;
}

interface ValidateHasSufficientBalanceProps {
  amount: string;
  tokenAccount?: TokenAccount;
}

export function validateHasSufficientBalance({
  amount,
  tokenAccount,
}: ValidateHasSufficientBalanceProps): string | undefined {
  if (!tokenAccount) {
    return "No token account found";
  }

  const cleanAmount = formatAmountInput(amount);
  const symbol = tokenAccount.symbol || "token";

  if (parseAmountBigNumber(cleanAmount).gt(0)) {
    const maxBalance = convertToDecimal(
      tokenAccount.amount || 0,
      tokenAccount.decimals || 0,
    );

    const maxBalanceRounded = parseAmountBigNumber(
      new Decimal(maxBalance.toString()).toFixed(5, Decimal.ROUND_DOWN),
    );

    if (parseAmountBigNumber(cleanAmount).gt(maxBalanceRounded)) {
      return `Insufficient ${symbol} balance.`;
    }
  }

  return undefined;
}

export function checkInsufficientBalance(
  amount: string,
  tokenAccount?: TokenAccount,
): boolean {
  if (!tokenAccount) return false;

  const cleanAmount = formatAmountInput(amount);
  const accountAmount = tokenAccount.amount || 0;
  const decimal = tokenAccount.decimals || 0;

  const maxBalance = convertToDecimal(accountAmount, decimal);
  const maxBalanceRounded = parseAmountBigNumber(
    new Decimal(maxBalance.toString()).toFixed(5, Decimal.ROUND_DOWN),
  );

  return parseAmountBigNumber(cleanAmount).gt(maxBalanceRounded);
}
