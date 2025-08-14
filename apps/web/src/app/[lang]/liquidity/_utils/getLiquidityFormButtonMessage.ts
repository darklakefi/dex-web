import type { GetPoolDetailsOutput } from "@dex-web/orpc/schemas/pools/getPoolDetails.schema";
import { convertToDecimal } from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

const BUTTON_MESSAGE = {
  ADD_LIQUIDITY: "Add Liquidity",
  CALCULATING: "calculating amounts...",
  CREATE_POOL: "Create Pool",
  CREATE_STEP_1: "Preparing pool creation [1/3]",
  CREATE_STEP_2: "Confirm transaction in your wallet [2/3]",
  CREATE_STEP_3: "Processing pool creation [3/3]",
  ENTER_AMOUNT: "enter an amount",
  ENTER_AMOUNTS: "Enter token amounts",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_PRICE: "Invalid price",
  LOADING: "loading",
  SAME_TOKENS: "Select different tokens",
  STEP_1: "protecting liquidity transaction [1/3]",
  STEP_2: "confirm liquidity in your wallet [2/3]",
  STEP_3: "verifying liquidity transaction [3/3]",
};

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
}: LiquidityFormButtonMessageProps) {
  const sellAmount = tokenBAmount.replace(/,/g, "");
  const buyAmount = tokenAAmount.replace(/,/g, "");

  if (createStep === 1) return BUTTON_MESSAGE.CREATE_STEP_1;
  if (createStep === 2) return BUTTON_MESSAGE.CREATE_STEP_2;
  if (createStep === 3) return BUTTON_MESSAGE.CREATE_STEP_3;

  if (liquidityStep === 1) return BUTTON_MESSAGE.STEP_1;
  if (liquidityStep === 2) return BUTTON_MESSAGE.STEP_2;
  if (liquidityStep === 3) return BUTTON_MESSAGE.STEP_3;
  if (liquidityStep === 10) return BUTTON_MESSAGE.CALCULATING;

  if (tokenBAddress === tokenAAddress) {
    return BUTTON_MESSAGE.SAME_TOKENS;
  }

  if (publicKey && sellAmount && BigNumber(sellAmount).gt(0)) {
    const sellTokenAcc = sellTokenAccount?.tokenAccounts?.[0];
    if (sellTokenAcc) {
      const maxBalance = convertToDecimal(
        sellTokenAcc.amount || 0,
        sellTokenAcc.decimals || 0,
      );
      if (BigNumber(sellAmount).gt(maxBalance)) {
        return BUTTON_MESSAGE.INSUFFICIENT_BALANCE;
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
        return BUTTON_MESSAGE.INSUFFICIENT_BALANCE;
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
      return BUTTON_MESSAGE.ENTER_AMOUNTS;
    }

    if (!initialPrice || new BigNumber(initialPrice).lte(0)) {
      return BUTTON_MESSAGE.INVALID_PRICE;
    }

    return BUTTON_MESSAGE.CREATE_POOL;
  }

  if (
    !sellAmount ||
    new BigNumber(sellAmount).lte(0) ||
    !buyAmount ||
    new BigNumber(buyAmount).lte(0)
  ) {
    return BUTTON_MESSAGE.ENTER_AMOUNT;
  }

  return BUTTON_MESSAGE.ADD_LIQUIDITY;
}
