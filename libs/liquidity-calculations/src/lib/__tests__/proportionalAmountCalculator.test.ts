import { describe, expect, it } from "vitest";
import {
  calculateProportionalAmount,
  calculateProportionalAmountBatch,
  formatProportionalResult,
} from "../proportionalAmountCalculator";

describe("calculateProportionalAmount", () => {
  describe("basic functionality", () => {
    it("should calculate proportional amount correctly", () => {
      const result = calculateProportionalAmount({
        inputAmount: "100",
        outputDecimals: 6,
        reserveInput: 1000,
        reserveOutput: 500,
      });

      expect(result.outputAmount).toBe("50.000000");
      expect(result.exactValue.toString()).toBe("50");
    });

    it("should handle decimal input amounts", () => {
      const result = calculateProportionalAmount({
        inputAmount: "123.456789",
        outputDecimals: 6,
        reserveInput: 1000,
        reserveOutput: 2000,
      });

      expect(result.outputAmount).toBe("246.913578");
    });

    it("should handle amounts with commas", () => {
      const result = calculateProportionalAmount({
        inputAmount: "1,234,567.89",
        outputDecimals: 6,
        reserveInput: 10000,
        reserveOutput: 5000,
      });

      expect(result.outputAmount).toBe("617283.945000");
    });
  });

  describe("precision handling", () => {
    it("should handle the reported error case", () => {
      const result = calculateProportionalAmount({
        inputAmount: "42897458.81141686",
        outputDecimals: 6,
        reserveInput: 235254217,
        reserveOutput: 1000000,
      });

      const rawUnits = BigInt(
        result.outputAmount.replace(".", "").replace(/^0+/, ""),
      );
      expect(rawUnits).toBeDefined();
      expect(typeof rawUnits).toBe("bigint");
    });

    it("should produce results that convert cleanly to raw units", () => {
      const result = calculateProportionalAmount({
        inputAmount: "182348.96264",
        outputDecimals: 6,
        reserveInput: 1000000,
        reserveOutput: 42897458,
      });

      const multiplied = Number(result.outputAmount) * 10 ** 6;
      expect(Number.isInteger(multiplied)).toBe(true);
    });

    it("should handle very large numbers without precision loss", () => {
      const result = calculateProportionalAmount({
        inputAmount: "999999999.999999",
        outputDecimals: 6,
        reserveInput: 1000000000,
        reserveOutput: 500000000,
      });

      expect(result.outputAmount).toBe("499999999.999999");
    });

    it("should handle very small numbers", () => {
      const result = calculateProportionalAmount({
        inputAmount: "0.000001",
        outputDecimals: 6,
        reserveInput: 1000,
        reserveOutput: 2000,
      });

      expect(result.outputAmount).toBe("0.000002");
    });
  });

  describe("edge cases", () => {
    it("should handle minimum positive amounts", () => {
      const result = calculateProportionalAmount({
        inputAmount: "0.000001",
        outputDecimals: 6,
        reserveInput: 1,
        reserveOutput: 1,
      });

      expect(result.outputAmount).toBe("0.000001");
    });

    it("should round down to avoid exceeding intended amount", () => {
      const result = calculateProportionalAmount({
        inputAmount: "1.999999999",
        outputDecimals: 6,
        reserveInput: 3,
        reserveOutput: 2,
      });

      expect(Number(result.outputAmount)).toBeLessThanOrEqual(
        (1.999999999 * 2) / 3,
      );
    });

    it("should handle equal reserves", () => {
      const result = calculateProportionalAmount({
        inputAmount: "12345.6789",
        outputDecimals: 6,
        reserveInput: 1000000,
        reserveOutput: 1000000,
      });

      expect(result.outputAmount).toBe("12345.678900");
      expect(result.ratio.toString()).toBe("1");
    });

    it("should handle unequal reserves correctly", () => {
      const result = calculateProportionalAmount({
        inputAmount: "100",
        outputDecimals: 6,
        reserveInput: 10000,
        reserveOutput: 1000,
      });

      expect(result.outputAmount).toBe("10.000000");
      expect(result.ratio.toString()).toBe("0.1");
    });
  });

  describe("validation and errors", () => {
    it("should throw error for empty input amount", () => {
      expect(() =>
        calculateProportionalAmount({
          inputAmount: "",
          outputDecimals: 6,
          reserveInput: 1000,
          reserveOutput: 500,
        }),
      ).toThrow("Input amount cannot be empty");
    });

    it("should throw error for zero reserves", () => {
      expect(() =>
        calculateProportionalAmount({
          inputAmount: "100",
          outputDecimals: 6,
          reserveInput: 0,
          reserveOutput: 500,
        }),
      ).toThrow("Reserves must be positive values");
    });

    it("should throw error for negative reserves", () => {
      expect(() =>
        calculateProportionalAmount({
          inputAmount: "100",
          outputDecimals: 6,
          reserveInput: -1000,
          reserveOutput: 500,
        }),
      ).toThrow("Reserves must be positive values");
    });

    it("should throw error for invalid input amount", () => {
      expect(() =>
        calculateProportionalAmount({
          inputAmount: "not a number",
          outputDecimals: 6,
          reserveInput: 1000,
          reserveOutput: 500,
        }),
      ).toThrow(/Invalid|not a number/);
    });

    it("should throw error for zero input amount", () => {
      expect(() =>
        calculateProportionalAmount({
          inputAmount: "0",
          outputDecimals: 6,
          reserveInput: 1000,
          reserveOutput: 500,
        }),
      ).toThrow("Input amount must be positive");
    });

    it("should throw error for negative decimals", () => {
      expect(() =>
        calculateProportionalAmount({
          inputAmount: "100",
          outputDecimals: -1,
          reserveInput: 1000,
          reserveOutput: 500,
        }),
      ).toThrow("Output decimals must be a non-negative integer");
    });
  });

  describe("real-world token scenarios", () => {
    it("should handle USDC to USDT", () => {
      const result = calculateProportionalAmount({
        inputAmount: "1000.50",
        outputDecimals: 6,
        reserveInput: 5000000,
        reserveOutput: 4950000,
      });

      expect(result.outputAmount).toBe("990.495000");
    });

    it("should handle SOL calculations", () => {
      const result = calculateProportionalAmount({
        inputAmount: "10.5",
        outputDecimals: 9,
        reserveInput: 100000,
        reserveOutput: 5000000,
      });

      expect(result.outputAmount).toBe("525.000000000");
    });

    it("should handle wrapped SOL to USDC", () => {
      const result = calculateProportionalAmount({
        inputAmount: "5.123456789",
        outputDecimals: 6,
        reserveInput: 10000,
        reserveOutput: 1500000,
      });

      expect(Number(result.outputAmount)).toBeGreaterThan(0);
      const rawUnits = Number(result.outputAmount) * 10 ** 6;
      expect(Number.isInteger(rawUnits)).toBe(true);
    });
  });
});

describe("calculateProportionalAmountBatch", () => {
  it("should calculate multiple amounts correctly", () => {
    const results = calculateProportionalAmountBatch([
      {
        inputAmount: "100",
        outputDecimals: 6,
        reserveInput: 1000,
        reserveOutput: 500,
      },
      {
        inputAmount: "200",
        outputDecimals: 6,
        reserveInput: 2000,
        reserveOutput: 1000,
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]?.outputAmount).toBe("50.000000");
    expect(results[1]?.outputAmount).toBe("100.000000");
  });

  it("should handle empty array", () => {
    const results = calculateProportionalAmountBatch([]);
    expect(results).toHaveLength(0);
  });
});

describe("formatProportionalResult", () => {
  it("should format result with default options", () => {
    const result = calculateProportionalAmount({
      inputAmount: "100",
      outputDecimals: 6,
      reserveInput: 1000,
      reserveOutput: 500,
    });

    const formatted = formatProportionalResult(result);
    expect(formatted).toBe("50");
  });

  it("should keep trailing zeros when specified", () => {
    const result = calculateProportionalAmount({
      inputAmount: "100",
      outputDecimals: 6,
      reserveInput: 1000,
      reserveOutput: 500,
    });

    const formatted = formatProportionalResult(result, {
      trimTrailingZeros: false,
    });
    expect(formatted).toBe("50.000000");
  });

  it("should add thousand separators", () => {
    const result = calculateProportionalAmount({
      inputAmount: "1234567.89",
      outputDecimals: 6,
      reserveInput: 1000,
      reserveOutput: 500,
    });

    const formatted = formatProportionalResult(result, {
      thousandSeparator: true,
    });
    expect(formatted).toContain(",");
  });

  it("should handle both options together", () => {
    const result = calculateProportionalAmount({
      inputAmount: "1000000",
      outputDecimals: 6,
      reserveInput: 2,
      reserveOutput: 1,
    });

    const formatted = formatProportionalResult(result, {
      thousandSeparator: true,
      trimTrailingZeros: false,
    });
    expect(formatted).toBe("500,000.000000");
  });
});
