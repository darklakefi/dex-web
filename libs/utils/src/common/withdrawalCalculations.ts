import BigNumber from "bignumber.js";
import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";
import { convertToDecimal } from "../number";

interface WithdrawalCalculationParams {
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
  defaultBuyToken?: string;
  defaultSellToken?: string;
  inputType?: "tokenX" | "tokenY";
}

export function calculateWithdrawalDetails({
  userLiquidity,
  poolReserves,
  withdrawalAmount,
  tokenAAddress,
  tokenBAddress,
  tokenAPrice,
  tokenBPrice,
  defaultBuyToken = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  defaultSellToken = "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
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

  let withdrawLpAmount: BigNumber;
  try {
    withdrawLpAmount = BigNumber(withdrawalAmount.replace(/,/g, ""));
    if (withdrawLpAmount.isNaN() || withdrawLpAmount.lte(0)) {
      return {
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      };
    }
  } catch {
    return {
      percentage: 0,
      tokenAAmount: 0,
      tokenBAmount: 0,
      usdValue: 0,
    };
  }

  const percentage = withdrawLpAmount
    .dividedBy(userLpBalance.toNumber())
    .multipliedBy(100);
  const withdrawLpShare = withdrawLpAmount.dividedBy(
    poolReserves.totalLpSupply,
  );

  const tokenXAmount = withdrawLpShare
    .multipliedBy(poolReserves.reserveX)
    .toNumber();
  const tokenYAmount = withdrawLpShare
    .multipliedBy(poolReserves.reserveY)
    .toNumber();

  const tokenA = tokenAAddress || defaultBuyToken;
  const tokenB = tokenBAddress || defaultSellToken;
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(tokenA, tokenB);

  const tokenAAmount = tokenA === tokenXAddress ? tokenXAmount : tokenYAmount;
  const tokenBAmount = tokenB === tokenYAddress ? tokenYAmount : tokenXAmount;

  const tokenAValue = BigNumber(tokenAAmount).multipliedBy(
    tokenAPrice.price || 0,
  );
  const tokenBValue = BigNumber(tokenBAmount).multipliedBy(
    tokenBPrice.price || 0,
  );
  const usdValue = tokenAValue.plus(tokenBValue).toNumber();

  return {
    percentage: percentage.toNumber(),
    tokenAAmount,
    tokenBAmount,
    usdValue,
  };
}
