import { Decimal } from "decimal.js";
import "./decimalConfig";

/**
 * Parse a string amount into a Decimal, handling comma separators.
 * @throws {Error} If the amount is invalid or non-positive
 */
export function parseAmountSafe(value: string): Decimal {
  const cleaned = value.replace(/,/g, "").trim();
  const decimal = new Decimal(cleaned);

  if (decimal.isNaN() || decimal.lte(0)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return decimal;
}

/**
 * Convert a Decimal amount to raw units (multiplied by 10^decimals).
 * @param amount - The amount in human-readable units
 * @param decimals - The number of decimal places for the token
 * @returns Raw units as bigint
 */
export function toRawUnits(amount: Decimal, decimals: number): bigint {
  const multiplier = new Decimal(10).pow(decimals);
  const rawAmount = amount.mul(multiplier);
  return BigInt(rawAmount.toFixed(0, Decimal.ROUND_DOWN));
}

/**
 * Apply slippage to create a maximum amount (adds slippage tolerance).
 * @param amount - Base amount
 * @param slippagePercent - Slippage percentage as a Decimal
 * @returns Amount with slippage added
 */
export function applySlippageToMax(
  amount: Decimal,
  slippagePercent: Decimal,
): Decimal {
  const slippageFactor = slippagePercent.div(100);
  return amount.mul(new Decimal(1).add(slippageFactor));
}
