import { Decimal } from "decimal.js";

/**
 * Liquidity math utilities matching @darklakefi/ts-sdk-on-chain
 * These functions handle LP token calculations for adding/removing liquidity
 */

// Configure Decimal.js for precision (matching SDK)
Decimal.set({
  precision: 40, // Higher precision for intermediate calculations
  rounding: Decimal.ROUND_DOWN,
});

export interface PoolReserves {
  reserveX: number;
  reserveY: number;
  totalLpSupply: number;
}

/**
 * Calculate LP tokens to mint when adding liquidity
 * Based on @darklakefi/ts-sdk-on-chain math
 *
 * For adding liquidity:
 * - lpFromX = (amountX / reserveX) * totalLpSupply
 * - lpFromY = (amountY / reserveY) * totalLpSupply
 * - Use minimum of both to ensure pool ratio is maintained
 *
 * @param amountX - Amount of token X to deposit (in human-readable units)
 * @param amountY - Amount of token Y to deposit (in human-readable units)
 * @param reserves - Current pool reserves (available reserves, excluding locked and fees)
 * @returns LP token amount to mint (in human-readable units, not raw)
 */
export function calculateLpTokensToMint(
  amountX: number,
  amountY: number,
  reserves: PoolReserves,
): Decimal {
  // For a new pool with no liquidity, return 1 LP token
  if (
    reserves.totalLpSupply === 0 ||
    reserves.reserveX === 0 ||
    reserves.reserveY === 0
  ) {
    return new Decimal(1);
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
  // This maintains the pool's ratio
  return Decimal.min(lpFromX, lpFromY);
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

  // amountX = (lpTokenAmount / totalLpSupply) * reserveX
  const amountX = decimalLpAmount
    .mul(decimalReserveX)
    .div(decimalTotalLpSupply);

  // amountY = (lpTokenAmount / totalLpSupply) * reserveY
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
    // Calculate Y amount: (inputX * reserveY) / reserveX
    return decimalInputAmount.mul(decimalReserveY).div(decimalReserveX);
  } else {
    // Calculate X amount: (inputY * reserveX) / reserveY
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

/**
 * Apply slippage to an amount
 *
 * @param amount - Base amount
 * @param slippagePercent - Slippage percentage (e.g., 0.5 for 0.5%)
 * @param isMax - If true, add slippage; if false, subtract slippage
 * @returns Amount with slippage applied
 */
export function applySlippage(
  amount: Decimal,
  slippagePercent: number,
  isMax: boolean,
): Decimal {
  const slippageFactor = new Decimal(slippagePercent).div(100);

  if (isMax) {
    // For max amounts, add slippage
    return amount.mul(new Decimal(1).add(slippageFactor));
  } else {
    // For min amounts, subtract slippage
    return amount.mul(new Decimal(1).sub(slippageFactor));
  }
}

/**
 * Convert a human-readable amount to raw units (multiplied by 10^decimals)
 * Uses Decimal.js to avoid floating point precision errors
 *
 * @param amount - Amount in human-readable units (can be Decimal or number)
 * @param decimals - Number of decimals for the token
 * @returns Raw units as bigint
 */
export function toRawUnitsBigint(
  amount: Decimal | number,
  decimals: number,
): bigint {
  const decimalAmount =
    amount instanceof Decimal ? amount : new Decimal(amount);
  const multiplier = new Decimal(10).pow(decimals);
  const rawAmount = decimalAmount.mul(multiplier);

  // Round down to ensure we get an integer
  return BigInt(rawAmount.toFixed(0, Decimal.ROUND_DOWN));
}
