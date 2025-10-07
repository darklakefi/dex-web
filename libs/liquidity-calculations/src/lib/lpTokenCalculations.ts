import { Decimal } from "decimal.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_DOWN,
});
export interface LpTokenCalculationParams {
  tokenAAmount: string;
  tokenBAmount: string;
  reserveX: number;
  reserveY: number;
  totalLpSupply: number;
}
export interface LpTokenCalculationResult {
  lpTokens: string;
  lpTokensNumber: number;
}
export function calculateLpTokensFromDeposit({
  tokenAAmount,
  tokenBAmount,
  reserveX,
  reserveY,
  totalLpSupply,
}: LpTokenCalculationParams): LpTokenCalculationResult {
  if (totalLpSupply === 0) {
    return {
      lpTokens: "1",
      lpTokensNumber: 1,
    };
  }
  const cleanAmountA = tokenAAmount.replace(/,/g, "");
  const cleanAmountB = tokenBAmount.replace(/,/g, "");
  const amountA = new Decimal(cleanAmountA);
  const amountB = new Decimal(cleanAmountB);
  const lpFromTokenA = amountA
    .mul(new Decimal(totalLpSupply))
    .div(new Decimal(reserveX));
  const lpFromTokenB = amountB
    .mul(new Decimal(totalLpSupply))
    .div(new Decimal(reserveY));
  const lpTokens = Decimal.min(lpFromTokenA, lpFromTokenB);
  return {
    lpTokens: lpTokens.toFixed(0, Decimal.ROUND_DOWN),
    lpTokensNumber: lpTokens.toNumber(),
  };
}
export interface WithdrawalCalculationParams {
  lpTokenAmount: string;
  userLpBalance: number;
  reserveX: number;
  reserveY: number;
  totalLpSupply: number;
  lpTokenDecimals: number;
}
export interface WithdrawalCalculationResult {
  tokenXAmount: string;
  tokenYAmount: string;
  percentage: string;
}
export function calculateWithdrawalAmounts({
  lpTokenAmount,
  userLpBalance,
  reserveX,
  reserveY,
  totalLpSupply,
  lpTokenDecimals,
}: WithdrawalCalculationParams): WithdrawalCalculationResult {
  const cleanAmount = lpTokenAmount.replace(/,/g, "");
  const withdrawAmount = new Decimal(cleanAmount);
  const userLpBalanceBN = new Decimal(userLpBalance).div(
    new Decimal(10).pow(lpTokenDecimals),
  );
  const percentage = withdrawAmount.div(userLpBalanceBN).mul(100);
  const totalLpSupplyDecimal = new Decimal(totalLpSupply).div(
    new Decimal(10).pow(lpTokenDecimals),
  );
  const withdrawLpShare = withdrawAmount.div(totalLpSupplyDecimal);
  const reserveXDecimal = new Decimal(reserveX);
  const reserveYDecimal = new Decimal(reserveY);
  const tokenXAmount = withdrawLpShare.mul(reserveXDecimal);
  const tokenYAmount = withdrawLpShare.mul(reserveYDecimal);
  return {
    percentage: percentage.toFixed(2, Decimal.ROUND_DOWN),
    tokenXAmount: tokenXAmount.toString(),
    tokenYAmount: tokenYAmount.toString(),
  };
}
export interface TokenAmountByPriceParams {
  amount: string;
  price: string;
}
export function calculateTokenAmountByPrice({
  amount,
  price,
}: TokenAmountByPriceParams): string {
  const cleanAmount = amount.replace(/,/g, "");
  const cleanPrice = price.replace(/,/g, "");
  const amountBN = new Decimal(cleanAmount);
  const priceBN = new Decimal(cleanPrice);
  if (amountBN.lte(0) || priceBN.lte(0)) {
    return "0";
  }
  return amountBN.mul(priceBN).toString();
}
