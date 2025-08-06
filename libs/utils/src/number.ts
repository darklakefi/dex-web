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

export function formatValueWithThousandSeparator(value: string) {
  const cleanValue = value.replace(/,/g, "");
  const regex = /^[0-9]*\.?[0-9]*$/;
  if (!regex.test(cleanValue)) {
    return value;
  }

  // Split the number into integer and decimal parts
  const parts = cleanValue.split(".");
  let integerPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (integerPart?.length && integerPart?.length >= 2) {
    integerPart = integerPart?.replace(/^0+/, "");
  }

  // If there's a decimal part, keep it as is without adding commas
  if (parts.length > 1) {
    return `${integerPart}.${parts[1]}`;
  }

  return integerPart;
}

/**
 * Validates if a string represents a valid number with comma separators
 * Accepts numbers with comma as thousand separator and properly formatted decimal part
 * Rejects numbers ending with decimal point without digits
 *
 * Examples:
 * - "4,000.00" -> valid
 * - "4." -> valid
 * - "1,234,567.89" -> valid
 * - "0.123" -> valid
 *
 * @param value The string to validate
 * @returns boolean indicating if the string is a valid number format
 */
export function isValidNumberFormat(value: string): boolean {
  if (!value) return false;

  // Allow empty string or just a decimal point
  if (value === "" || value === ".") return true;

  // Regular expression to validate number format with commas as thousand separators
  // and optional decimal part
  const regex = /^-?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d*)?$/;

  return regex.test(value);
}
