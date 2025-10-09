import { Decimal } from "decimal.js";
import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";
import { convertToDecimal } from "../number";
import "./decimalConfig";

/**
 * Input type for withdrawal calculations
 */
export enum InputType {
  Percentage = "percentage",
  Raw = "raw",
}

/**
 * Parameters for withdrawal calculation
 */
export interface WithdrawalCalculationParams {
  userLiquidity: {
    lpTokenBalance: number;
    decimals: number;
  } | null;
  poolReserves: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  } | null;
  withdrawalAmount: string;
  tokenAAddress: string;
  tokenBAddress: string;
  tokenAPrice: { price: number };
  tokenBPrice: { price: number };
  inputType?: InputType;
  defaultBuyToken?: string;
  defaultSellToken?: string;
}

/**
 * Calculate withdrawal details for removing liquidity.
 * Supports both percentage-based and raw amount inputs.
 *
 * @param params - Withdrawal calculation parameters
 * @returns Calculated withdrawal amounts and USD value
 */
export function calculateWithdrawalDetails({
  userLiquidity,
  poolReserves,
  withdrawalAmount,
  tokenAAddress,
  tokenBAddress,
  tokenAPrice,
  tokenBPrice,
  inputType = InputType.Percentage,
  defaultBuyToken = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  defaultSellToken = "So11111111111111111111111111111111111111112",
}: WithdrawalCalculationParams) {
  if (
    !userLiquidity ||
    !poolReserves ||
    !withdrawalAmount ||
    withdrawalAmount.trim() === "" ||
    poolReserves.totalLpSupply === 0
  ) {
    return {
      percentage: 0,
      tokenAAmount: 0,
      tokenBAmount: 0,
      usdValue: 0,
    };
  }

  const userLpBalance = convertToDecimal(
    userLiquidity.lpTokenBalance,
    userLiquidity.decimals,
  );

  let withdrawLpAmount: Decimal;
  let percentage: Decimal;

  try {
    const inputAmount = new Decimal(withdrawalAmount.replace(/,/g, ""));
    if (!inputAmount.isFinite() || inputAmount.lte(0)) {
      return {
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      };
    }

    if (inputType === InputType.Percentage) {
      percentage = inputAmount;
      withdrawLpAmount = userLpBalance.mul(percentage.div(100));
    } else {
      withdrawLpAmount = convertToDecimal(
        inputAmount.toNumber(),
        userLiquidity.decimals,
      );
      percentage = withdrawLpAmount.div(userLpBalance).mul(100);
    }
  } catch {
    return {
      percentage: 0,
      tokenAAmount: 0,
      tokenBAmount: 0,
      usdValue: 0,
    };
  }
  const totalLpSupplyDecimal = convertToDecimal(
    poolReserves.totalLpSupply,
    userLiquidity.decimals,
  );
  const withdrawLpShare = withdrawLpAmount.div(totalLpSupplyDecimal);

  const reserveXDecimal = convertToDecimal(
    poolReserves.reserveX,
    userLiquidity.decimals,
  );
  const reserveYDecimal = convertToDecimal(
    poolReserves.reserveY,
    userLiquidity.decimals,
  );
  const tokenXAmount = withdrawLpShare.mul(reserveXDecimal).toNumber();
  const tokenYAmount = withdrawLpShare.mul(reserveYDecimal).toNumber();

  const tokenA = tokenAAddress || defaultBuyToken;
  const tokenB = tokenBAddress || defaultSellToken;
  const { tokenXAddress } = sortSolanaAddresses(tokenA, tokenB);

  const tokenAAmount = tokenA === tokenXAddress ? tokenXAmount : tokenYAmount;
  const tokenBAmount = tokenB === tokenXAddress ? tokenXAmount : tokenYAmount;

  const tokenAValue = new Decimal(tokenAAmount).mul(tokenAPrice.price || 0);
  const tokenBValue = new Decimal(tokenBAmount).mul(tokenBPrice.price || 0);
  const usdValue = tokenAValue.add(tokenBValue).toNumber();

  return {
    percentage: percentage.toNumber(),
    tokenAAmount,
    tokenBAmount,
    usdValue,
  };
}
