import { convertToDecimal } from "../number";
import { formatAmountInput, parseAmountBigNumber } from "./amountUtils";

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

    if (parseAmountBigNumber(cleanAmount).gt(maxBalance)) {
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

  return parseAmountBigNumber(cleanAmount).gt(
    convertToDecimal(accountAmount, decimal),
  );
}
