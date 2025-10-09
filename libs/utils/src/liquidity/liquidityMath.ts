import { Decimal } from "decimal.js";
import "./decimalConfig";

/**
 * Liquidity pool math utilities for human-readable calculations.
 * These functions work with number types for UI/display purposes.
 *
 * For protocol-level calculations with bigint, see liquidityCalculations.ts
 */

export interface PoolReserves {
  reserveX: number;
  reserveY: number;
  totalLpSupply: number;
}

/**
 * Calculate the amount of tokens to receive when removing liquidity
 *
 * @param lpTokenAmount - Amount of LP tokens to burn (in human-readable units)
 * @param reserves - Current pool reserves
 * @returns Amount of X and Y tokens to receive
 */
export function calculateTokensFromLpBurn(
  lpTokenAmount: number,
  reserves: PoolReserves,
): { amountX: Decimal; amountY: Decimal } {
  if (reserves.totalLpSupply === 0) {
    return {
      amountX: new Decimal(0),
      amountY: new Decimal(0),
    };
  }

  const decimalLpAmount = new Decimal(lpTokenAmount);
  const decimalReserveX = new Decimal(reserves.reserveX);
  const decimalReserveY = new Decimal(reserves.reserveY);
  const decimalTotalLpSupply = new Decimal(reserves.totalLpSupply);

  const amountX = decimalLpAmount
    .mul(decimalReserveX)
    .div(decimalTotalLpSupply);

  const amountY = decimalLpAmount
    .mul(decimalReserveY)
    .div(decimalTotalLpSupply);

  return { amountX, amountY };
}

/**
 * Calculate the other token amount needed to maintain pool ratio
 *
 * @param inputAmount - Amount of the input token
 * @param isTokenX - Whether the input token is X (true) or Y (false)
 * @param reserves - Current pool reserves
 * @returns Amount of the other token needed
 */
export function calculateTokenAmountForRatio(
  inputAmount: number,
  isTokenX: boolean,
  reserves: PoolReserves,
): Decimal {
  if (reserves.reserveX === 0 || reserves.reserveY === 0) {
    return new Decimal(0);
  }

  const decimalInputAmount = new Decimal(inputAmount);
  const decimalReserveX = new Decimal(reserves.reserveX);
  const decimalReserveY = new Decimal(reserves.reserveY);

  if (isTokenX) {
    return decimalInputAmount.mul(decimalReserveY).div(decimalReserveX);
  } else {
    return decimalInputAmount.mul(decimalReserveX).div(decimalReserveY);
  }
}

/**
 * Calculate pool share percentage
 *
 * @param lpTokenAmount - User's LP token amount
 * @param totalLpSupply - Total LP supply in the pool
 * @returns Share percentage (0-100)
 */
export function calculatePoolShare(
  lpTokenAmount: number,
  totalLpSupply: number,
): Decimal {
  if (totalLpSupply === 0) {
    return new Decimal(0);
  }

  const decimalLpAmount = new Decimal(lpTokenAmount);
  const decimalTotalLpSupply = new Decimal(totalLpSupply);

  return decimalLpAmount.div(decimalTotalLpSupply).mul(100);
}
