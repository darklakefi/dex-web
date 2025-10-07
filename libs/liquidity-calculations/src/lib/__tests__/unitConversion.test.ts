import { describe, expect, it } from "vitest";
import {
  safeParseAmount,
  toDecimals,
  toRawUnits,
  toRawUnitsBigint,
  validateAmountForRawConversion,
} from "../unitConversion";

describe("toRawUnitsBigint", () => {
  describe("successful conversions", () => {
    it("should convert decimal amount to raw units", () => {
      const result = toRawUnitsBigint("1.5", 6);
      expect(result).toBe(1500000n);
    });

    it("should handle whole numbers", () => {
      const result = toRawUnitsBigint("100", 6);
      expect(result).toBe(100000000n);
    });

    it("should handle numeric input", () => {
      const result = toRawUnitsBigint(1.5, 6);
      expect(result).toBe(1500000n);
    });

    it("should handle zero decimals", () => {
      const result = toRawUnitsBigint("42", 0);
      expect(result).toBe(42n);
    });

    it("should handle maximum precision", () => {
      const result = toRawUnitsBigint("1.123456", 6);
      expect(result).toBe(1123456n);
    });

    it("should handle very small amounts", () => {
      const result = toRawUnitsBigint("0.000001", 6);
      expect(result).toBe(1n);
    });
  });

  describe("the problematic case", () => {
    it("should reject floating-point corrupted value", () => {
      expect(() => toRawUnitsBigint(42897458.81141686, 6)).toThrow(
        "results in non-integer",
      );
    });

    it("should accept properly formatted string value", () => {
      const result = toRawUnitsBigint("42897458.811416", 6);
      expect(result).toBe(42897458811416n);
    });
  });

  describe("validation errors", () => {
    it("should throw error for non-integer result", () => {
      expect(() => toRawUnitsBigint("1.1234567", 6)).toThrow(
        "results in non-integer",
      );
    });

    it("should throw error for exceeding u64 maximum", () => {
      expect(() => toRawUnitsBigint("18446744073709551616", 0)).toThrow(
        "exceeds u64 maximum",
      );
    });

    it("should throw error for negative values", () => {
      expect(() => toRawUnitsBigint("-1.5", 6)).toThrow("cannot be negative");
    });

    it("should throw error for invalid string", () => {
      expect(() => toRawUnitsBigint("not a number", 6)).toThrow();
    });
  });

  describe("boundary conditions", () => {
    it("should handle maximum u64 value", () => {
      const result = toRawUnitsBigint("18446744073709551615", 0);
      expect(result).toBe(18446744073709551615n);
    });

    it("should handle minimum positive value", () => {
      const result = toRawUnitsBigint("0.000001", 6);
      expect(result).toBe(1n);
    });
  });

  describe("different decimal precisions", () => {
    it("should handle 0 decimals", () => {
      const result = toRawUnitsBigint("42", 0);
      expect(result).toBe(42n);
    });

    it("should handle 6 decimals", () => {
      const result = toRawUnitsBigint("1.234567", 6);
      expect(result).toBe(1234567n);
    });

    it("should handle 9 decimals", () => {
      const result = toRawUnitsBigint("1.123456789", 9);
      expect(result).toBe(1123456789n);
    });

    it("should handle 18 decimals", () => {
      const result = toRawUnitsBigint("1.123456789012345678", 18);
      expect(result).toBe(1123456789012345678n);
    });
  });
});

describe("toRawUnits", () => {
  it("should return BigNumber for intermediate calculations", () => {
    const result = toRawUnits("1.5", 6);
    expect(result.toString()).toBe("1500000");
  });

  it("should handle string input", () => {
    const result = toRawUnits("123.456", 6);
    expect(result.toString()).toBe("123456000");
  });

  it("should handle numeric input", () => {
    const result = toRawUnits(123.456, 6);
    expect(result.toString()).toBe("123456000");
  });
});

describe("toDecimals", () => {
  it("should convert raw units back to decimals", () => {
    const result = toDecimals(1500000, 6);
    expect(result.toString()).toBe("1.5");
  });

  it("should handle string input", () => {
    const result = toDecimals("1000000", 6);
    expect(result.toString()).toBe("1");
  });

  it("should handle bigint input", () => {
    const result = toDecimals(1500000n, 6);
    expect(result.toString()).toBe("1.5");
  });

  it("should handle large numbers", () => {
    const result = toDecimals("123456789000000", 6);
    expect(result.toString()).toBe("123456789");
  });

  it("should handle zero", () => {
    const result = toDecimals(0, 6);
    expect(result.toString()).toBe("0");
  });

  describe("round-trip conversions", () => {
    it("should maintain precision for USDC amounts", () => {
      const original = "1234.567890";
      const raw = toRawUnits(original, 6);
      const back = toDecimals(raw, 6);
      expect(back.toString()).toBe("1234.56789");
    });

    it("should maintain precision for SOL amounts", () => {
      const original = "10.123456789";
      const raw = toRawUnits(original, 9);
      const back = toDecimals(raw, 9);
      expect(back.toString()).toBe(original);
    });
  });
});

describe("safeParseAmount", () => {
  it("should parse valid number strings", () => {
    expect(safeParseAmount("123.456")).toBe(123.456);
  });

  it("should remove commas", () => {
    expect(safeParseAmount("1,234,567.89")).toBe(1234567.89);
  });

  it("should handle whole numbers", () => {
    expect(safeParseAmount("42")).toBe(42);
  });

  it("should handle decimal numbers", () => {
    expect(safeParseAmount("0.123456")).toBe(0.123456);
  });

  it("should throw error for invalid input", () => {
    expect(() => safeParseAmount("not a number")).toThrow(
      /Invalid|not a number/,
    );
  });

  it("should throw error for infinity", () => {
    expect(() => safeParseAmount("Infinity")).toThrow("Invalid amount");
  });

  it("should handle scientific notation", () => {
    expect(safeParseAmount("1.23e5")).toBe(123000);
  });

  it("should handle negative numbers", () => {
    expect(safeParseAmount("-123.456")).toBe(-123.456);
  });
});

describe("validateAmountForRawConversion", () => {
  describe("valid amounts", () => {
    it("should validate correct amount", () => {
      const result = validateAmountForRawConversion("1.234567", 6);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate whole numbers", () => {
      const result = validateAmountForRawConversion("100", 6);
      expect(result.valid).toBe(true);
    });

    it("should validate amounts with commas", () => {
      const result = validateAmountForRawConversion("1,234.567890", 6);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid amounts", () => {
    it("should reject non-integer raw units", () => {
      const result = validateAmountForRawConversion("1.1234567", 6);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too many decimal places");
    });

    it("should reject zero amounts", () => {
      const result = validateAmountForRawConversion("0", 6);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Amount must be positive");
    });

    it("should reject negative amounts", () => {
      const result = validateAmountForRawConversion("-1.5", 6);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Amount must be positive");
    });

    it("should reject amounts exceeding u64 max", () => {
      const result = validateAmountForRawConversion("99999999999999999999", 6);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Amount exceeds maximum value");
    });

    it("should reject invalid format", () => {
      const result = validateAmountForRawConversion("not a number", 6);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Invalid|not a number/);
    });
  });

  describe("precision checks", () => {
    it("should accept amount with exact decimals", () => {
      const result = validateAmountForRawConversion("1.123456", 6);
      expect(result.valid).toBe(true);
    });

    it("should accept amount with fewer decimals", () => {
      const result = validateAmountForRawConversion("1.12", 6);
      expect(result.valid).toBe(true);
    });

    it("should reject amount with too many decimals", () => {
      const result = validateAmountForRawConversion("1.1234567", 6);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too many decimal places");
    });
  });

  describe("the bug case", () => {
    it("should detect problematic floating-point value", () => {
      const result = validateAmountForRawConversion("42897458.81141686", 6);
      expect(result.valid).toBe(false);
    });

    it("should accept properly rounded version", () => {
      const result = validateAmountForRawConversion("42897458.811416", 6);
      expect(result.valid).toBe(true);
    });
  });
});

describe("integration tests", () => {
  it("should handle complete liquidity calculation flow", () => {
    const userInput = "100.50";
    const parsed = safeParseAmount(userInput);
    expect(parsed).toBe(100.5);

    const rawUnits = toRawUnitsBigint(userInput, 6);
    expect(rawUnits).toBe(100500000n);

    const backToDecimal = toDecimals(rawUnits, 6);
    expect(backToDecimal.toNumber()).toBe(100.5);
  });

  it("should validate before conversion", () => {
    const amount = "1.1234567";
    const validation = validateAmountForRawConversion(amount, 6);

    if (!validation.valid) {
      expect(validation.error).toContain("too many decimal places");
      expect(() => toRawUnitsBigint(amount, 6)).toThrow();
    }
  });

  it("should handle precision-safe workflow", () => {
    const testCases = [
      { amount: "42897458.811416", expected: 42897458811416n },
      { amount: "182348.962640", expected: 182348962640n },
      { amount: "0.000001", expected: 1n },
      { amount: "999999999.999999", expected: 999999999999999n },
    ];

    for (const testCase of testCases) {
      const validation = validateAmountForRawConversion(testCase.amount, 6);
      expect(validation.valid).toBe(true);

      const raw = toRawUnitsBigint(testCase.amount, 6);
      expect(raw).toBe(testCase.expected);

      const backToDecimal = toDecimals(raw, 6);
      expect(backToDecimal.toNumber()).toBeCloseTo(Number(testCase.amount), 6);
    }
  });
});
