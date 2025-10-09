import { Decimal } from "decimal.js";

export function calculateProportionalAmount(
  inputAmount: string,
  inputToken: "tokenA" | "tokenB",
  poolReserves: {
    reserveX: number;
    reserveY: number;
  },
  tokenMapping: {
    tokenAIsX: boolean;
  },
): string | null {
  try {
    const amount = new Decimal(inputAmount);
    if (amount.isNaN() || amount.lte(0)) {
      return null;
    }

    if (poolReserves.reserveX <= 0 || poolReserves.reserveY <= 0) {
      return null;
    }

    const reserveX = new Decimal(poolReserves.reserveX);
    const reserveY = new Decimal(poolReserves.reserveY);

    let result: Decimal;

    if (inputToken === "tokenA") {
      if (tokenMapping.tokenAIsX) {
        result = amount.mul(reserveY).div(reserveX);
      } else {
        result = amount.mul(reserveX).div(reserveY);
      }
    } else {
      if (tokenMapping.tokenAIsX) {
        result = amount.mul(reserveX).div(reserveY);
      } else {
        result = amount.mul(reserveY).div(reserveX);
      }
    }

    return result.toFixed(6, Decimal.ROUND_DOWN);
  } catch (error) {
    console.error("Error calculating proportional amount:", error);
    return null;
  }
}
