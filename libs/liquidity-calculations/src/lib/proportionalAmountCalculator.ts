import { Decimal } from "decimal.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_DOWN,
});

export interface ProportionalAmountParams {
  inputAmount: string;
  reserveInput: number;
  reserveOutput: number;
  outputDecimals: number;
}

export interface ProportionalAmountResult {
  outputAmount: string;
  exactValue: Decimal;
  ratio: Decimal;
}

export function calculateProportionalAmount({
  inputAmount,
  reserveInput,
  reserveOutput,
  outputDecimals,
}: ProportionalAmountParams): ProportionalAmountResult {
  if (!inputAmount?.trim()) {
    throw new Error("Input amount cannot be empty");
  }

  if (reserveInput <= 0 || reserveOutput <= 0) {
    throw new Error("Reserves must be positive values");
  }

  if (outputDecimals < 0 || !Number.isInteger(outputDecimals)) {
    throw new Error("Output decimals must be a non-negative integer");
  }

  const cleanAmount = inputAmount.replace(/,/g, "");
  const inputBN = new Decimal(cleanAmount);

  if (!inputBN.isFinite()) {
    throw new Error(`Invalid input amount: ${inputAmount}`);
  }

  if (inputBN.lte(0)) {
    throw new Error("Input amount must be positive");
  }

  const ratio = new Decimal(reserveOutput).div(new Decimal(reserveInput));
  const exactValue = inputBN.mul(ratio);
  const outputAmount = exactValue.toFixed(outputDecimals, Decimal.ROUND_DOWN);

  const verification = new Decimal(outputAmount).mul(
    new Decimal(10).pow(outputDecimals),
  );

  if (!verification.isInteger()) {
    throw new Error(
      `Internal error: Result ${outputAmount} with ${outputDecimals} decimals would produce non-integer raw units`,
    );
  }

  return {
    exactValue,
    outputAmount,
    ratio,
  };
}

export function calculateProportionalAmountBatch(
  params: ProportionalAmountParams[],
): ProportionalAmountResult[] {
  return params.map(calculateProportionalAmount);
}

export function formatProportionalResult(
  result: ProportionalAmountResult,
  options: {
    trimTrailingZeros?: boolean;
    thousandSeparator?: boolean;
  } = {},
): string {
  const { trimTrailingZeros = true, thousandSeparator = true } = options;
  let formatted = result.outputAmount;

  if (trimTrailingZeros) {
    formatted = formatted.replace(/\.?0+$/, "");
  }

  if (thousandSeparator) {
    const parts = formatted.split(".");
    parts[0] = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "";
    formatted = parts.join(".");
  }

  return formatted;
}
