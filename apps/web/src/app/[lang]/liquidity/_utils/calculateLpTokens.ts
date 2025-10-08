import { Decimal } from "decimal.js";

// Configure Decimal.js for precision (matching @darklakefi/ts-sdk-on-chain)
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_DOWN,
});

/**
 * Calculates the LP token amount for a given liquidity deposit
 * Uses Decimal.js for precision (matching @darklakefi/ts-sdk-on-chain approach)
 * @param amountX - Amount of token X to deposit (in human-readable units)
 * @param amountY - Amount of token Y to deposit (in human-readable units)
 * @param reserves - Current pool reserves (in raw units)
 * @returns LP token amount to mint (in raw units, NOT multiplied by decimals)
 */
export function calculateLpTokenAmount(
  amountX: number,
  amountY: number,
  reserves: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  },
): bigint {
  // For a new pool with no liquidity, return a default amount
  if (
    reserves.totalLpSupply === 0 ||
    reserves.reserveX === 0 ||
    reserves.reserveY === 0
  ) {
    return BigInt(1);
  }

  // Convert to Decimal for precise calculations
  const decimalAmountX = new Decimal(amountX);
  const decimalAmountY = new Decimal(amountY);
  const decimalReserveX = new Decimal(reserves.reserveX);
  const decimalReserveY = new Decimal(reserves.reserveY);
  const decimalTotalLpSupply = new Decimal(reserves.totalLpSupply);

  // Calculate LP tokens based on the proportion of liquidity added
  // lpFromX = (amountX / reserveX) * totalLpSupply
  const lpFromX = decimalAmountX.mul(decimalTotalLpSupply).div(decimalReserveX);

  // lpFromY = (amountY / reserveY) * totalLpSupply
  const lpFromY = decimalAmountY.mul(decimalTotalLpSupply).div(decimalReserveY);

  // Use the minimum to ensure both amounts are satisfied
  const lpTokens = Decimal.min(lpFromX, lpFromY);

  // Round down and convert to bigint
  return BigInt(lpTokens.toFixed(0, Decimal.ROUND_DOWN));
}
