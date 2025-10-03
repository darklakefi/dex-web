export const parseFormAmount = (value: string): number => {
  return Number(value.replace(/,/g, ""));
};
