import { Decimal } from "decimal.js";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_DOWN,
});

const MAX_U64 = new Decimal("18446744073709551615");

export function toRawUnitsBigint(
  amount: string | number,
  decimals: number,
): bigint {
  const result = new Decimal(amount).mul(new Decimal(10).pow(decimals));

  if (!result.isInteger()) {
    throw new Error(
      `Amount ${amount} with ${decimals} decimals results in non-integer: ${result.toString()}`,
    );
  }

  if (result.gt(MAX_U64)) {
    throw new Error(`Value ${result.toString()} exceeds u64 maximum`);
  }

  if (result.lt(0)) {
    throw new Error(`Value ${result.toString()} cannot be negative`);
  }

  return BigInt(result.toString());
}

export function toRawUnits(amount: string | number, decimals: number): Decimal {
  return new Decimal(amount).mul(new Decimal(10).pow(decimals));
}

export function toDecimals(
  rawAmount: string | number | bigint | Decimal,
  decimals: number,
): Decimal {
  return new Decimal(rawAmount.toString()).div(new Decimal(10).pow(decimals));
}

export function safeParseAmount(amount: string): number {
  const cleanAmount = amount.replace(/,/g, "");
  const bn = new Decimal(cleanAmount);

  if (!bn.isFinite()) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  return bn.toNumber();
}

export function validateAmountForRawConversion(
  amount: string,
  decimals: number,
): { valid: boolean; error?: string } {
  try {
    const cleanAmount = amount.replace(/,/g, "");
    const bn = new Decimal(cleanAmount);

    if (!bn.isFinite()) {
      return { error: "Invalid number format", valid: false };
    }

    if (bn.lte(0)) {
      return { error: "Amount must be positive", valid: false };
    }

    const rawUnits = bn.mul(new Decimal(10).pow(decimals));

    if (!rawUnits.isInteger()) {
      return {
        error: `Amount has too many decimal places for ${decimals} decimals`,
        valid: false,
      };
    }

    if (rawUnits.gt(MAX_U64)) {
      return { error: "Amount exceeds maximum value", valid: false };
    }

    return { valid: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      valid: false,
    };
  }
}
