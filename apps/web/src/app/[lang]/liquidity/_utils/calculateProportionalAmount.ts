import { Decimal } from "decimal.js";

/**
 * Calculate the proportional amount of the other token based on pool reserves
 *
 * When adding liquidity to an existing pool, tokens must be added in the same ratio
 * as the current pool reserves to maintain the price.
 *
 * Formula:
 * - If entering tokenA amount: tokenB = (tokenA * reserveY) / reserveX
 * - If entering tokenB amount: tokenA = (tokenB * reserveX) / reserveY
 *
 * @param inputAmount - The amount entered by the user (human-readable)
 * @param inputToken - Which token the user is entering ("tokenA" or "tokenB")
 * @param poolReserves - Current pool reserves in human-readable units
 * @returns The calculated proportional amount for the other token
 */
export function calculateProportionalAmount(
  inputAmount: string,
  inputToken: "tokenA" | "tokenB",
  poolReserves: {
    reserveX: number;
    reserveY: number;
  },
  tokenMapping: {
    tokenAIsX: boolean; // true if tokenA corresponds to reserveX
  },
): string | null {
  try {
    // Parse and validate input
    const amount = new Decimal(inputAmount);
    if (amount.isNaN() || amount.lte(0)) {
      return null;
    }

    // Check if reserves are valid
    if (poolReserves.reserveX <= 0 || poolReserves.reserveY <= 0) {
      return null;
    }

    const reserveX = new Decimal(poolReserves.reserveX);
    const reserveY = new Decimal(poolReserves.reserveY);

    // Calculate proportional amount based on which token was entered
    let result: Decimal;

    if (inputToken === "tokenA") {
      // User entered tokenA, calculate tokenB
      if (tokenMapping.tokenAIsX) {
        // tokenA is X, so calculate Y amount: (amountX * reserveY) / reserveX
        result = amount.mul(reserveY).div(reserveX);
      } else {
        // tokenA is Y, so calculate X amount: (amountY * reserveX) / reserveY
        result = amount.mul(reserveX).div(reserveY);
      }
    } else {
      // User entered tokenB, calculate tokenA
      if (tokenMapping.tokenAIsX) {
        // tokenB is Y, so calculate X amount: (amountY * reserveX) / reserveY
        result = amount.mul(reserveX).div(reserveY);
      } else {
        // tokenB is X, so calculate Y amount: (amountX * reserveY) / reserveX
        result = amount.mul(reserveY).div(reserveX);
      }
    }

    // Round to 6 decimal places for display
    return result.toFixed(6, Decimal.ROUND_DOWN);
  } catch (error) {
    console.error("Error calculating proportional amount:", error);
    return null;
  }
}
