import BigNumber from "bignumber.js";
import Decimal from "decimal.js";

/**
 * Token Amount Utilities
 *
 * This module provides utilities for working with token amounts, separating:
 * 1. Data representation (full precision, for calculations/validation)
 * 2. Display formatting (limited precision, for UI)
 *
 * Key principle: Never lose precision in the data layer.
 * Only format for display when rendering to the user.
 */

export interface TokenAmountData {
  /**
   * The raw amount in atomic units (smallest denomination)
   * This is the source of truth and maintains full precision
   */
  readonly atomicAmount: bigint;

  /**
   * The number of decimal places for this token
   */
  readonly decimals: number;
}

/**
 * Converts atomic units to a decimal string with full precision
 * This should be used for data storage and calculations
 */
export function atomicToDecimalString(
  atomicAmount: bigint | number,
  decimals: number,
): string {
  const amount = new Decimal(atomicAmount.toString());
  const divisor = new Decimal(10).pow(decimals);
  return amount.div(divisor).toString();
}

/**
 * Converts a decimal string to atomic units
 * This should be used when converting user input to blockchain format
 */
export function decimalStringToAtomic(
  decimalAmount: string,
  decimals: number,
): bigint {
  const amount = new Decimal(decimalAmount);
  const multiplier = new Decimal(10).pow(decimals);
  return BigInt(amount.mul(multiplier).toFixed(0));
}

/**
 * Formats a decimal string for display purposes
 * This ONLY affects display and should never be stored
 *
 * @param decimalAmount - The full-precision decimal string
 * @param maxDisplayDecimals - Maximum decimals to show (default: 5)
 * @param trimTrailingZeros - Whether to remove trailing zeros (default: true)
 */
export function formatTokenAmountForDisplay(
  decimalAmount: string,
  maxDisplayDecimals: number = 5,
  trimTrailingZeros: boolean = true,
): string {
  if (!decimalAmount || decimalAmount === "0") return "0";

  const bn = new BigNumber(decimalAmount);
  let formatted = bn.toFixed(maxDisplayDecimals, BigNumber.ROUND_DOWN);

  if (trimTrailingZeros) {
    formatted = formatted.replace(/\.?0+$/, "");
  }

  return formatted;
}

/**
 * Calculates half of a token amount, maintaining full precision
 * Returns the full-precision decimal string
 */
export function calculateHalfAmount(
  atomicAmount: bigint | number,
  decimals: number,
): string {
  const fullAmount = atomicToDecimalString(atomicAmount, decimals);
  return new Decimal(fullAmount).div(2).toString();
}

/**
 * Calculates the maximum usable amount (full balance)
 * Returns the full-precision decimal string
 */
export function calculateMaxAmount(
  atomicAmount: bigint | number,
  decimals: number,
): string {
  return atomicToDecimalString(atomicAmount, decimals);
}

/**
 * Validates if an amount exceeds the available balance
 * Uses full precision for accurate comparison
 */
export function exceedsBalance(
  inputAmount: string,
  atomicBalance: bigint | number,
  decimals: number,
): boolean {
  try {
    const balanceDecimal = atomicToDecimalString(atomicBalance, decimals);
    const inputBN = new BigNumber(inputAmount);
    const balanceBN = new BigNumber(balanceDecimal);

    return inputBN.gt(balanceBN);
  } catch {
    return false;
  }
}

/**
 * Compares two amounts for equality with proper precision handling
 */
export function amountsAreEqual(
  amount1: string,
  amount2: string,
  epsilon: string = "0.000000001",
): boolean {
  try {
    const bn1 = new BigNumber(amount1);
    const bn2 = new BigNumber(amount2);
    const diff = bn1.minus(bn2).abs();
    return diff.lte(epsilon);
  } catch {
    return false;
  }
}
