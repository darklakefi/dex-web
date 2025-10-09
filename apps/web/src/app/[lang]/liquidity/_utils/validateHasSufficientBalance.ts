import type { TokenAccount } from "@dex-web/orpc/schemas/index";
import { convertToDecimal } from "@dex-web/utils";
import BigNumber from "bignumber.js";

interface ValidateHasSufficientBalanceProps {
  amount: string;
  tokenAccount?: TokenAccount;
}

export function validateHasSufficientBalance({
  amount,
  tokenAccount,
}: ValidateHasSufficientBalanceProps) {
  if (!tokenAccount) {
    return "No token account found";
  }

  const tokenANumericValue = amount.replace(/,/g, "");
  const symbol = tokenAccount.symbol || "token";
  if (BigNumber(tokenANumericValue).gt(0)) {
    const maxBalance = convertToDecimal(
      tokenAccount.amount || 0,
      tokenAccount.decimals || 0,
    );

    if (BigNumber(tokenANumericValue).gt(maxBalance.toString())) {
      return `Insufficient ${symbol} balance.`;
    }
  }

  return undefined;
}
