import { Decimal } from "decimal.js";

/**
 * Centralized Decimal.js configuration for liquidity calculations.
 * Higher precision is required for intermediate calculations to avoid rounding errors.
 */
export function configureDecimal(): void {
  Decimal.set({
    precision: 40,
    rounding: Decimal.ROUND_DOWN,
  });
}

// Configure immediately on module load
configureDecimal();
