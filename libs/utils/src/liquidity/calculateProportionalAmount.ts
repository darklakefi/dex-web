import { Decimal } from "decimal.js";

export interface PoolDetails {
  readonly tokenXMint: string;
  readonly tokenYMint: string;
  readonly tokenXReserve?: number;
  readonly tokenYReserve?: number;
}

export interface CalculateProportionalAmountParams {
  readonly inputAmount: string;
  readonly editedToken: "tokenA" | "tokenB";
  readonly tokenAAddress: string;
  readonly tokenBAddress: string;
  readonly poolDetails: PoolDetails;
}

/**
 * Pure function to calculate proportional token amounts for liquidity pools.
 * No side effects, no mutations - just deterministic calculations.
 *
 * @param params - Calculation parameters
 * @returns The calculated proportional amount, or null if calculation fails
 */
export function calculateProportionalAmount(
  params: CalculateProportionalAmountParams,
): number | null {
  const { inputAmount, editedToken, tokenAAddress, poolDetails } = params;

  // Check if we have the necessary data - prefer human-readable reserves
  if (!poolDetails.tokenXReserve || !poolDetails.tokenYReserve) {
    return null;
  }

  try {
    const amount = new Decimal(inputAmount);
    if (amount.isNaN() || amount.lte(0)) {
      return null;
    }

    const tokenAIsX = tokenAAddress === poolDetails.tokenXMint;

    // Use HUMAN-READABLE reserves (already have decimals divided out)
    // These should already account for available reserves (fees subtracted) from the hook
    const reserveX = new Decimal(poolDetails.tokenXReserve);
    const reserveY = new Decimal(poolDetails.tokenYReserve);

    console.log("🔄 Proportional calculation (human-readable):", {
      editedToken,
      inputAmount: amount.toString(),
      reserveX: reserveX.toString(),
      reserveY: reserveY.toString(),
      tokenAIsX,
    });

    let result: Decimal;

    if (editedToken === "tokenA") {
      result = tokenAIsX
        ? amount.mul(reserveY).div(reserveX)
        : amount.mul(reserveX).div(reserveY);
    } else {
      result = tokenAIsX
        ? amount.mul(reserveX).div(reserveY)
        : amount.mul(reserveY).div(reserveX);
    }

    console.log("🔄 Calculated proportional amount:", result.toString());

    // Round UP to ensure we always request slightly more, preventing slippage errors
    // Use 9 decimals for precision (works for both 6 and 9 decimal tokens)
    return Number(result.toFixed(9, Decimal.ROUND_UP));
  } catch (error) {
    console.error("Error calculating proportional amount:", error);
    return null;
  }
}
