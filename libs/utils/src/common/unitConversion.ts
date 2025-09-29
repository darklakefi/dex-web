import BigNumber from "bignumber.js";

export const toRawUnits = (amount: number, decimals: number) => {
  return BigNumber(amount).multipliedBy(BigNumber(10 ** decimals));
};

export const toRawUnitsBigint = (amount: number, decimals: number): bigint => {
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

export const toDecimals = (amount: number | BigNumber, decimals: number) => {
  return BigNumber(amount).dividedBy(BigNumber(10 ** decimals));
};
