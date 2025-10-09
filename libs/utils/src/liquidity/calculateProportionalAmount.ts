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
  readonly tokenADecimals: number;
  readonly tokenBDecimals: number;
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
  const {
    inputAmount,
    editedToken,
    tokenAAddress,
    poolDetails,
    tokenADecimals,
    tokenBDecimals,
  } = params;

  if (!poolDetails.tokenXReserve || !poolDetails.tokenYReserve) {
    return null;
  }

  try {
    const amount = new Decimal(inputAmount);
    if (amount.isNaN() || amount.lte(0)) {
      return null;
    }

    const tokenAIsX = tokenAAddress === poolDetails.tokenXMint;
    const reserveX = new Decimal(poolDetails.tokenXReserve);
    const reserveY = new Decimal(poolDetails.tokenYReserve);

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

    const outputTokenDecimals =
      editedToken === "tokenA" ? tokenBDecimals : tokenADecimals;
    return Number(result.toFixed(outputTokenDecimals, Decimal.ROUND_DOWN));
  } catch (error) {
    console.error("Error calculating proportional amount:", error);
    return null;
  }
}
