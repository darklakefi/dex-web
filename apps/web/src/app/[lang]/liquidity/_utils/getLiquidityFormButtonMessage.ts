import type { GetPoolDetailsOutput } from "@dex-web/orpc/schemas/pools/getPoolDetails.schema";
import { convertToDecimal } from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

interface TokenAccountData {
  tokenAccounts?: Array<{
    amount: number;
    decimals: number;
    symbol: string;
  }>;
}

interface LiquidityFormButtonMessageProps {
  tokenAAmount: string;
  tokenBAmount: string;
  initialPrice: string;
  createStep: number;
  liquidityStep: number;
  poolDetails: GetPoolDetailsOutput | null;
  tokenBAddress: string;
  tokenAAddress: string;
  buyTokenAccount?: TokenAccountData | null;
  sellTokenAccount?: TokenAccountData | null;
  publicKey: PublicKey;
  t: (key: string) => string;
}

export function getLiquidityFormButtonMessage({
  tokenAAmount,
  tokenBAmount,
  initialPrice,
  createStep,
  liquidityStep,
  poolDetails,
  tokenBAddress,
  tokenAAddress,
  buyTokenAccount,
  sellTokenAccount,
  publicKey,
  t,
}: LiquidityFormButtonMessageProps) {
  const sellAmount = tokenBAmount.replace(/,/g, "");
  const buyAmount = tokenAAmount.replace(/,/g, "");

  if (createStep === 1) return t("createStep1");
  if (createStep === 2) return t("createStep2");
  if (createStep === 3) return t("createStep3");

  if (liquidityStep === 1) return t("step1");
  if (liquidityStep === 2) return t("step2");
  if (liquidityStep === 3) return t("step3");
  if (liquidityStep === 10) return t("calculating");

  if (tokenBAddress === tokenAAddress) {
    return t("sameTokens");
  }

  if (publicKey && sellAmount && BigNumber(sellAmount).gt(0)) {
    const sellTokenAcc = sellTokenAccount?.tokenAccounts?.[0];
    if (sellTokenAcc) {
      const maxBalance = convertToDecimal(
        sellTokenAcc.amount || 0,
        sellTokenAcc.decimals || 0,
      );
      if (BigNumber(sellAmount).gt(maxBalance)) {
        return t("insufficientBalance");
      }
    }
  }

  if (publicKey && buyAmount && BigNumber(buyAmount).gt(0)) {
    const buyTokenAcc = buyTokenAccount?.tokenAccounts?.[0];
    if (buyTokenAcc) {
      const maxBalance = convertToDecimal(
        buyTokenAcc.amount || 0,
        buyTokenAcc.decimals || 0,
      );
      if (BigNumber(buyAmount).gt(maxBalance)) {
        return t("insufficientBalance");
      }
    }
  }

  if (!poolDetails) {
    if (
      !sellAmount ||
      new BigNumber(sellAmount).lte(0) ||
      !buyAmount ||
      new BigNumber(buyAmount).lte(0)
    ) {
      return t("enterAmounts");
    }

    if (!initialPrice || new BigNumber(initialPrice).lte(0)) {
      return t("invalidPrice");
    }

    return t("createPool");
  }

  if (
    !sellAmount ||
    new BigNumber(sellAmount).lte(0) ||
    !buyAmount ||
    new BigNumber(buyAmount).lte(0)
  ) {
    return t("enterAmount");
  }

  return t("addLiquidity");
}
