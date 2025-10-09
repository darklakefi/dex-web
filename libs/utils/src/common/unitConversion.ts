import BigNumber from "bignumber.js";

/**
 * Convert amount to raw units using BigNumber (for server-side orpc handlers).
 * Returns BigNumber for further calculations.
 *
 * @param amount - Amount in human-readable units
 * @param decimals - Number of decimal places
 * @returns Raw units as BigNumber
 */
export const toRawUnitsBigNumber = (amount: number, decimals: number) => {
  return BigNumber(amount).multipliedBy(BigNumber(10 ** decimals));
};

/**
 * Convert amount to raw units using BigNumber, returned as bigint (for server-side orpc handlers).
 * Validates that result is an integer and within u64 range.
 *
 * @param amount - Amount in human-readable units
 * @param decimals - Number of decimal places
 * @returns Raw units as bigint
 * @throws {Error} If result is not an integer or exceeds u64 maximum
 */
export const toRawUnitsBigNumberAsBigInt = (
  amount: number,
  decimals: number,
): bigint => {
  const result = BigNumber(amount).multipliedBy(BigNumber(10 ** decimals));

  if (!result.isInteger()) {
    throw new Error(
      `Amount ${amount} with ${decimals} decimals results in non-integer: ${result.toString()}`,
    );
  }

  const MAX_U64 = BigNumber("18446744073709551615");
  if (result.isGreaterThan(MAX_U64)) {
    throw new Error(`Value ${result.toString()} exceeds u64 maximum`);
  }

  return BigInt(result.toString());
};

/**
 * Convert raw units to human-readable decimals using BigNumber (for server-side orpc handlers).
 *
 * @param amount - Amount in raw units (number or BigNumber)
 * @param decimals - Number of decimal places
 * @returns Amount in human-readable units as BigNumber
 */
export const toDecimalsBigNumber = (
  amount: number | BigNumber,
  decimals: number,
) => {
  return BigNumber(amount).dividedBy(BigNumber(10 ** decimals));
};
