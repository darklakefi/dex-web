import BigNumber from "bignumber.js";

export const parseAmount = (value: string): number => {
  return Number(value.replace(/,/g, ""));
};

export const parseAmountBigNumber = (value: string): BigNumber => {
  return BigNumber(value.replace(/,/g, ""));
};

export const formatAmountInput = (value: string): string => {
  return value.replace(/,/g, "");
};

export const isValidAmount = (value: string): boolean => {
  const cleaned = formatAmountInput(value);
  return !Number.isNaN(Number(cleaned)) && Number(cleaned) > 0;
};

export const isValidAmountBigNumber = (value: string): boolean => {
  const cleaned = formatAmountInput(value);
  return BigNumber(cleaned).gt(0);
};