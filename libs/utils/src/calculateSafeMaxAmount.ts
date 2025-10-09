import { atomicToDecimalString } from "./tokenAmount";

export interface CalculateSafeMaxAmountParams {
  /**
   * The atomic amount (balance in smallest unit)
   */
  atomicAmount: bigint | number;

  /**
   * Number of decimals for the token
   */
  decimals: number;

  /**
   * Optional maximum number of decimal places to display/input
   * If specified, the result will be truncated (rounded down) to this precision
   * to ensure validation passes when using MAX button
   */
  maxDecimals?: number;
}

/**
 * Calculates a safe maximum amount that can be used for the MAX button.
 *
 * This function ensures that:
 * 1. The amount is converted from atomic units to decimal string
 * 2. If maxDecimals is specified, the amount is truncated (not rounded) to that precision
 * 3. The truncated amount will never exceed the original balance when converted back
 * 4. Trailing zeros are removed for clean display
 *
 * **Why truncate?**
 * When a form input has a maxDecimals constraint (e.g., 5 decimal places), but the token
 * has more precision (e.g., 9 decimals), we need to ensure the MAX amount doesn't get
 * rejected by validation. By truncating to maxDecimals, we guarantee the value fits
 * the input constraints and passes balance validation.
 *
 * @example
 * ```typescript
 * // Token with 9 decimals, form allows 5
 * calculateSafeMaxAmount({
 *   atomicAmount: 274402754340000n,
 *   decimals: 9,
 *   maxDecimals: 5
 * });
 * // Returns: "274402.75434"
 * // Original: 274402.754340000 (9 decimals)
 * // Truncated: 274402.75434 (5 decimals)
 * ```
 *
 * @param params - Calculation parameters
 * @returns Decimal string representation, truncated to maxDecimals if specified
 */
export function calculateSafeMaxAmount({
  atomicAmount,
  decimals,
  maxDecimals,
}: CalculateSafeMaxAmountParams): string {
  const decimalString = atomicToDecimalString(atomicAmount, decimals);

  if (maxDecimals !== undefined) {
    const parts = decimalString.split(".");

    if (parts.length === 1) {
      return parts[0] ?? "0";
    }

    const integerPart = parts[0] ?? "0";
    const decimalPart = parts[1];

    if (!decimalPart) {
      return integerPart;
    }

    if (maxDecimals === 0) {
      return integerPart;
    }

    if (decimalPart.length <= maxDecimals) {
      return decimalString;
    }

    const truncatedDecimal = decimalPart.slice(0, maxDecimals);

    const trimmedDecimal = truncatedDecimal.replace(/0+$/, "");

    if (trimmedDecimal === "") {
      return integerPart;
    }

    return `${integerPart}.${trimmedDecimal}`;
  }

  return decimalString;
}
