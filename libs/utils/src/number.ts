import BigNumber from "bignumber.js";

export function convertToDecimal(
  value: number | string | BigNumber,
  decimalPlaces: number = 8,
) {
  const divideBy = 10 ** decimalPlaces;
  return BigNumber(value).dividedBy(divideBy);
}

export function convertToWholeNumber(
  value: number | string | BigNumber,
  decimalPlaces: number = 8,
) {
  const multiply = 10 ** decimalPlaces;
  return BigNumber(value).multipliedBy(multiply);
}

type NumberFormatHelperParams = {
  value: string | number | BigNumber;
  trimTrailingZeros?: boolean;
  decimalScale?: number;
  prefix?: string;
  suffix?: string;
  thousandSeparator?: boolean;
};

/**
 * Added from front-end source.
 *
 * Formats a number according to the provided parameters.
 *
 * @param {Object} params - The parameters for formatting the number.
 * @param {string | number | BigNumber} params.value - The number to format.
 * @param {boolean} [params.trimTrailingZeros=false] - Whether to trim trailing zeros after the decimal point.
 * @param {number} [params.decimalScale=8] - The number of digits after the decimal point.
 * @param {string} [params.prefix=""] - The prefix to add before the number.
 * @param {boolean} [params.thousandSeparator=true] - Whether to use a comma as a thousand separator.
 * @returns {string} The formatted number.
 */
export function numberFormatHelper({
  value,
  trimTrailingZeros = false,
  decimalScale = 8,
  prefix = "",
  suffix = "",
  thousandSeparator = true,
}: NumberFormatHelperParams): string {
  const fmt: BigNumber.Format = {
    decimalSeparator: ".",
    groupSeparator: thousandSeparator ? "," : "",
    groupSize: thousandSeparator ? 3 : 0,
    prefix,
    suffix,
  };
  let formattedNumber = new BigNumber(value).toFormat(decimalScale, fmt);
  if (trimTrailingZeros) {
    formattedNumber = formattedNumber.replace(
      /(?:\.0+|(\.\d*?[1-9])0+)$/,
      "$1",
    );
  }

  return formattedNumber;
}
