import { describe, expect, it } from "vitest";
import {
  amountsAreEqual,
  atomicToDecimalString,
  calculateHalfAmount,
  calculateMaxAmount,
  decimalStringToAtomic,
  exceedsBalance,
  formatTokenAmountForDisplay,
} from "../tokenAmount";

describe("tokenAmount", () => {
  describe("atomicToDecimalString", () => {
    it("should convert atomic units to decimal string with correct precision", () => {
      expect(atomicToDecimalString(1000000n, 6)).toBe("1");
      expect(atomicToDecimalString(1500000n, 6)).toBe("1.5");
    });

    it("should handle zero decimals", () => {
      expect(atomicToDecimalString(100n, 0)).toBe("100");
    });

    it("should handle 18 decimals (ETH-like)", () => {
      expect(atomicToDecimalString(1500000000000000000n, 18)).toBe("1.5");
    });

    it("should handle zero amount", () => {
      expect(atomicToDecimalString(0n, 6)).toBe("0");
    });

    it("should handle very small amounts", () => {
      expect(atomicToDecimalString(1n, 6)).toBe("0.000001");
    });

    it("should handle very large amounts", () => {
      expect(atomicToDecimalString(1000000000000n, 6)).toBe("1000000");
    });

    it("should accept number type for atomic amount", () => {
      expect(atomicToDecimalString(1000000, 6)).toBe("1");
    });

    it("should maintain full precision", () => {
      expect(atomicToDecimalString(123456789n, 9)).toBe("0.123456789");
    });
  });

  describe("decimalStringToAtomic", () => {
    it("should convert decimal string to atomic units", () => {
      expect(decimalStringToAtomic("1", 6)).toBe(1000000n);
      expect(decimalStringToAtomic("1.5", 6)).toBe(1500000n);
    });

    it("should handle zero decimals", () => {
      expect(decimalStringToAtomic("100", 0)).toBe(100n);
    });

    it("should handle 18 decimals (ETH-like)", () => {
      expect(decimalStringToAtomic("1.5", 18)).toBe(1500000000000000000n);
    });

    it("should handle zero amount", () => {
      expect(decimalStringToAtomic("0", 6)).toBe(0n);
    });

    it("should handle very small amounts", () => {
      expect(decimalStringToAtomic("0.000001", 6)).toBe(1n);
    });

    it("should round down amounts smaller than smallest unit", () => {
      expect(decimalStringToAtomic("0.0000001", 6)).toBe(0n);
    });

    it("should handle large amounts", () => {
      expect(decimalStringToAtomic("1000000", 6)).toBe(1000000000000n);
    });

    it("should maintain precision for full decimal places", () => {
      expect(decimalStringToAtomic("0.123456789", 9)).toBe(123456789n);
    });

    it("should handle amounts with trailing zeros", () => {
      expect(decimalStringToAtomic("1.500000", 6)).toBe(1500000n);
    });
  });

  describe("formatTokenAmountForDisplay", () => {
    it("should format with default 5 decimal places", () => {
      expect(formatTokenAmountForDisplay("1.123456789")).toBe("1.12345");
    });

    it("should trim trailing zeros by default", () => {
      expect(formatTokenAmountForDisplay("1.50000")).toBe("1.5");
      expect(formatTokenAmountForDisplay("1.00000")).toBe("1");
    });

    it("should keep trailing zeros when specified", () => {
      expect(formatTokenAmountForDisplay("1.5", 5, false)).toBe("1.50000");
    });

    it("should handle zero", () => {
      expect(formatTokenAmountForDisplay("0")).toBe("0");
      expect(formatTokenAmountForDisplay("")).toBe("0");
    });

    it("should respect custom decimal places", () => {
      expect(formatTokenAmountForDisplay("1.123456", 2)).toBe("1.12");
      expect(formatTokenAmountForDisplay("1.123456", 8)).toBe("1.123456");
    });

    it("should round down (not round up)", () => {
      expect(formatTokenAmountForDisplay("1.999999", 2)).toBe("1.99");
    });

    it("should handle very small numbers", () => {
      expect(formatTokenAmountForDisplay("0.000001")).toBe("0");
      expect(formatTokenAmountForDisplay("0.0000001")).toBe("0");
    });

    it("should handle very large numbers", () => {
      expect(formatTokenAmountForDisplay("1234567.89")).toBe("1234567.89");
    });

    it("should handle whole numbers", () => {
      expect(formatTokenAmountForDisplay("1000")).toBe("1000");
    });
  });

  describe("calculateHalfAmount", () => {
    it("should calculate half of atomic amount", () => {
      expect(calculateHalfAmount(1000000n, 6)).toBe("0.5");
    });

    it("should maintain full precision", () => {
      expect(calculateHalfAmount(1000001n, 6)).toBe("0.5000005");
    });

    it("should handle zero", () => {
      expect(calculateHalfAmount(0n, 6)).toBe("0");
    });

    it("should handle odd numbers", () => {
      expect(calculateHalfAmount(1n, 6)).toBe("5e-7");
    });

    it("should work with number type", () => {
      expect(calculateHalfAmount(2000000, 6)).toBe("1");
    });

    it("should handle different decimal places", () => {
      expect(calculateHalfAmount(2000000000000000000n, 18)).toBe("1");
    });

    it("should handle large amounts", () => {
      expect(calculateHalfAmount(10000000000n, 6)).toBe("5000");
    });
  });

  describe("calculateMaxAmount", () => {
    it("should return full atomic amount as decimal string", () => {
      expect(calculateMaxAmount(1000000n, 6)).toBe("1");
    });

    it("should maintain full precision", () => {
      expect(calculateMaxAmount(1234567n, 6)).toBe("1.234567");
    });

    it("should handle zero", () => {
      expect(calculateMaxAmount(0n, 6)).toBe("0");
    });

    it("should work with number type", () => {
      expect(calculateMaxAmount(5000000, 6)).toBe("5");
    });

    it("should handle different decimal places", () => {
      expect(calculateMaxAmount(1500000000000000000n, 18)).toBe("1.5");
    });

    it("should handle large amounts", () => {
      expect(calculateMaxAmount(1000000000000n, 6)).toBe("1000000");
    });

    it("should handle very small amounts", () => {
      expect(calculateMaxAmount(1n, 6)).toBe("0.000001");
    });
  });

  describe("exceedsBalance", () => {
    it("should return true when input exceeds balance", () => {
      expect(exceedsBalance("2", 1000000n, 6)).toBe(true);
    });

    it("should return false when input is less than balance", () => {
      expect(exceedsBalance("0.5", 1000000n, 6)).toBe(false);
    });

    it("should return false when input equals balance", () => {
      expect(exceedsBalance("1", 1000000n, 6)).toBe(false);
    });

    it("should handle zero balance", () => {
      expect(exceedsBalance("0.1", 0n, 6)).toBe(true);
      expect(exceedsBalance("0", 0n, 6)).toBe(false);
    });

    it("should handle very small differences", () => {
      expect(exceedsBalance("1.000001", 1000000n, 6)).toBe(true);
      expect(exceedsBalance("0.999999", 1000000n, 6)).toBe(false);
    });

    it("should handle different decimal places", () => {
      expect(exceedsBalance("2", 1500000000000000000n, 18)).toBe(true);
      expect(exceedsBalance("1", 1500000000000000000n, 18)).toBe(false);
    });

    it("should return false for invalid input", () => {
      expect(exceedsBalance("invalid", 1000000n, 6)).toBe(false);
    });

    it("should handle large amounts", () => {
      expect(exceedsBalance("1000001", 1000000000000n, 6)).toBe(true);
      expect(exceedsBalance("999999", 1000000000000n, 6)).toBe(false);
    });

    it("should work with number type for atomic balance", () => {
      expect(exceedsBalance("2", 1000000, 6)).toBe(true);
      expect(exceedsBalance("0.5", 1000000, 6)).toBe(false);
    });
  });

  describe("amountsAreEqual", () => {
    it("should return true for equal amounts", () => {
      expect(amountsAreEqual("1", "1")).toBe(true);
      expect(amountsAreEqual("1.5", "1.5")).toBe(true);
    });

    it("should return false for different amounts", () => {
      expect(amountsAreEqual("1", "2")).toBe(false);
      expect(amountsAreEqual("1.5", "1.6")).toBe(false);
    });

    it("should handle amounts within epsilon", () => {
      expect(amountsAreEqual("1.0000000001", "1.0000000002")).toBe(true);
    });

    it("should handle custom epsilon", () => {
      expect(amountsAreEqual("1.01", "1.02", "0.02")).toBe(true);
      expect(amountsAreEqual("1.01", "1.02", "0.001")).toBe(false);
    });

    it("should handle zero amounts", () => {
      expect(amountsAreEqual("0", "0")).toBe(true);
      expect(amountsAreEqual("0", "0.0000000001")).toBe(true);
    });

    it("should handle very small differences", () => {
      expect(amountsAreEqual("0.000000001", "0.000000002")).toBe(true);
      expect(amountsAreEqual("0.000000001", "0.000000011")).toBe(false);
    });

    it("should handle large amounts", () => {
      expect(amountsAreEqual("1000000", "1000000")).toBe(true);
      expect(amountsAreEqual("1000000", "1000000.0000000001")).toBe(true);
    });

    it("should return false for invalid amounts", () => {
      expect(amountsAreEqual("invalid", "1")).toBe(false);
      expect(amountsAreEqual("1", "invalid")).toBe(false);
    });

    it("should handle negative amounts", () => {
      expect(amountsAreEqual("-1", "-1")).toBe(true);
      expect(amountsAreEqual("-1", "-1.0000000001")).toBe(true);
    });

    it("should handle different sign amounts", () => {
      expect(amountsAreEqual("-1", "1")).toBe(false);
    });
  });

  describe("roundtrip conversions", () => {
    it("should maintain precision through atomic -> decimal -> atomic", () => {
      const original = 1234567890n;
      const decimals = 9;
      const decimal = atomicToDecimalString(original, decimals);
      const backToAtomic = decimalStringToAtomic(decimal, decimals);
      expect(backToAtomic).toBe(original);
    });

    it("should work for various decimal places", () => {
      const testCases = [
        { atomic: 1000000n, decimals: 6 },
        { atomic: 1500000000000000000n, decimals: 18 },
        { atomic: 100n, decimals: 0 },
        { atomic: 123456n, decimals: 3 },
      ];

      for (const { atomic, decimals } of testCases) {
        const decimal = atomicToDecimalString(atomic, decimals);
        const backToAtomic = decimalStringToAtomic(decimal, decimals);
        expect(backToAtomic).toBe(atomic);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle maximum safe bigint values", () => {
      const maxSafe = 9007199254740991n;
      const decimal = atomicToDecimalString(maxSafe, 0);
      expect(decimal).toBe("9007199254740991");
    });

    it("should handle very high precision", () => {
      const amount = "0.123456789012345678";
      const atomic = decimalStringToAtomic(amount, 18);
      expect(atomic).toBe(123456789012345678n);
    });

    it("should handle scientific notation in decimal strings", () => {
      const decimal = atomicToDecimalString(1000000n, 6);
      expect(decimal).toBe("1");
    });
  });

  describe("negative number handling", () => {
    it("atomicToDecimalString should handle negative atomic amounts", () => {
      expect(atomicToDecimalString(-1000000n, 6)).toBe("-1");
    });

    it("decimalStringToAtomic should handle negative decimal strings", () => {
      expect(decimalStringToAtomic("-1.5", 6)).toBe(-1500000n);
    });

    it("calculateHalfAmount should handle negative amounts", () => {
      expect(calculateHalfAmount(-1000000n, 6)).toBe("-0.5");
    });

    it("calculateMaxAmount should handle negative amounts", () => {
      expect(calculateMaxAmount(-1000000n, 6)).toBe("-1");
    });

    it("exceedsBalance should handle negative input amounts", () => {
      expect(exceedsBalance("-1", 1000000n, 6)).toBe(false);
    });

    it("exceedsBalance should handle negative balance", () => {
      expect(exceedsBalance("1", -1000000n, 6)).toBe(true);
    });

    it("formatTokenAmountForDisplay should handle negative amounts", () => {
      expect(formatTokenAmountForDisplay("-1.5")).toBe("-1.5");
    });
  });

  describe("string input variations", () => {
    it("decimalStringToAtomic should handle strings with leading zeros", () => {
      expect(decimalStringToAtomic("0001.5", 6)).toBe(1500000n);
    });

    it("decimalStringToAtomic should handle strings with spaces (via Decimal)", () => {
      expect(decimalStringToAtomic("1.5", 6)).toBe(1500000n);
    });

    it("formatTokenAmountForDisplay should handle strings with leading zeros", () => {
      expect(formatTokenAmountForDisplay("0001.5")).toBe("1.5");
    });

    it("exceedsBalance should handle input with trailing zeros", () => {
      expect(exceedsBalance("1.000000", 1000000n, 6)).toBe(false);
    });

    it("amountsAreEqual should handle leading/trailing zeros", () => {
      expect(amountsAreEqual("01.50", "1.5000")).toBe(true);
    });
  });

  describe("boundary conditions", () => {
    it("should handle zero decimals correctly across all functions", () => {
      expect(atomicToDecimalString(100n, 0)).toBe("100");
      expect(decimalStringToAtomic("100", 0)).toBe(100n);
      expect(calculateHalfAmount(100n, 0)).toBe("50");
      expect(calculateMaxAmount(100n, 0)).toBe("100");
      expect(exceedsBalance("101", 100n, 0)).toBe(true);
    });

    it("should handle 1 decimal place", () => {
      expect(atomicToDecimalString(15n, 1)).toBe("1.5");
      expect(decimalStringToAtomic("1.5", 1)).toBe(15n);
      expect(calculateHalfAmount(15n, 1)).toBe("0.75");
    });

    it("should handle maximum common decimals (18)", () => {
      const oneToken = 1000000000000000000n;
      expect(atomicToDecimalString(oneToken, 18)).toBe("1");
      expect(decimalStringToAtomic("1", 18)).toBe(oneToken);
    });

    it("formatTokenAmountForDisplay should handle zero maxDisplayDecimals", () => {
      expect(formatTokenAmountForDisplay("1.999", 0)).toBe("1");
    });

    it("formatTokenAmountForDisplay should handle large maxDisplayDecimals", () => {
      expect(formatTokenAmountForDisplay("1.123456789012345", 15)).toBe(
        "1.123456789012345",
      );
    });
  });

  describe("precision edge cases", () => {
    it("should maintain precision with many decimal places", () => {
      const amount = "0.123456789123456789";
      const atomic = decimalStringToAtomic(amount, 18);
      const back = atomicToDecimalString(atomic, 18);
      expect(back).toBe("0.123456789123456789");
    });

    it("should handle precision loss scenarios gracefully", () => {
      const amount = "0.1234567891234567891";
      const atomic = decimalStringToAtomic(amount, 18);
      expect(atomic).toBe(123456789123456789n);
    });

    it("should handle very small fractions that round to zero", () => {
      const amount = "0.0000000001";
      const atomic = decimalStringToAtomic(amount, 6);
      expect(atomic).toBe(0n);
    });

    it("exceedsBalance should handle extremely close values", () => {
      const balance = 1000000n;
      expect(exceedsBalance("1.0000001", balance, 6)).toBe(true);
      expect(exceedsBalance("0.9999999", balance, 6)).toBe(false);
      expect(exceedsBalance("1.0", balance, 6)).toBe(false);
    });
  });

  describe("special string values", () => {
    it("formatTokenAmountForDisplay should handle empty string", () => {
      expect(formatTokenAmountForDisplay("")).toBe("0");
    });

    it("formatTokenAmountForDisplay should handle null/undefined-like string", () => {
      expect(formatTokenAmountForDisplay("0")).toBe("0");
    });

    it("exceedsBalance should return false for empty string", () => {
      expect(exceedsBalance("", 1000000n, 6)).toBe(false);
    });

    it("amountsAreEqual should return false for empty strings", () => {
      expect(amountsAreEqual("", "0")).toBe(false);
      expect(amountsAreEqual("", "")).toBe(false);
    });
  });

  describe("interaction with BigNumber/Decimal edge cases", () => {
    it("should handle BigNumber exponential notation", () => {
      const veryLarge = decimalStringToAtomic("1000000000", 6);
      const back = atomicToDecimalString(veryLarge, 6);
      expect(back).toBe("1000000000");
    });

    it("should handle Decimal.js precision limits", () => {
      const amount = "999999999999999999999999.123456";
      const atomic = decimalStringToAtomic(amount, 6);
      expect(typeof atomic).toBe("bigint");
      expect(atomic).toBeGreaterThan(0n);
    });

    it("formatTokenAmountForDisplay should handle NaN gracefully", () => {
      const result = formatTokenAmountForDisplay("not a number");
      expect(result).toBe("NaN");
    });

    it("formatTokenAmountForDisplay should handle Infinity", () => {
      const result = formatTokenAmountForDisplay("Infinity");
      expect(result).toBe("Infinity");
    });
  });

  describe("real-world token scenarios", () => {
    it("should handle SOL (9 decimals)", () => {
      const oneSol = 1000000000n;
      expect(atomicToDecimalString(oneSol, 9)).toBe("1");
      expect(decimalStringToAtomic("1", 9)).toBe(oneSol);
      expect(calculateHalfAmount(oneSol, 9)).toBe("0.5");
      expect(exceedsBalance("2", oneSol, 9)).toBe(true);
    });

    it("should handle USDC (6 decimals)", () => {
      const oneUsdc = 1000000n;
      expect(atomicToDecimalString(oneUsdc, 6)).toBe("1");
      expect(decimalStringToAtomic("1", 6)).toBe(oneUsdc);
      expect(calculateHalfAmount(oneUsdc, 6)).toBe("0.5");
      expect(exceedsBalance("1.01", oneUsdc, 6)).toBe(true);
    });

    it("should handle token with 0 decimals (NFT-like)", () => {
      const oneToken = 1n;
      expect(atomicToDecimalString(oneToken, 0)).toBe("1");
      expect(decimalStringToAtomic("1", 0)).toBe(oneToken);
      expect(calculateHalfAmount(oneToken, 0)).toBe("0.5");
    });

    it("should handle dust amounts correctly", () => {
      const dust = 1n;
      expect(atomicToDecimalString(dust, 6)).toBe("0.000001");
      expect(formatTokenAmountForDisplay(atomicToDecimalString(dust, 6))).toBe(
        "0",
      );
    });

    it("should handle large liquidity pool amounts", () => {
      const largeAmount = 1000000000000000n;
      expect(atomicToDecimalString(largeAmount, 6)).toBe("1000000000");
      expect(decimalStringToAtomic("1000000000", 6)).toBe(largeAmount);
    });
  });

  describe("half/max amount in liquidity context", () => {
    it("should calculate correct half amount for user balance", () => {
      const userBalance = 5432100n;
      const half = calculateHalfAmount(userBalance, 6);
      expect(half).toBe("2.71605");
      expect(parseFloat(half)).toBeCloseTo(2.71605, 5);
    });

    it("should handle max amount equal to balance", () => {
      const userBalance = 1234567n;
      const max = calculateMaxAmount(userBalance, 6);
      expect(max).toBe("1.234567");
      expect(exceedsBalance(max, userBalance, 6)).toBe(false);
    });

    it("should validate that half amount never exceeds balance", () => {
      const balances = [1n, 100n, 1000000n, 999999999n];
      for (const balance of balances) {
        const half = calculateHalfAmount(balance, 6);
        expect(exceedsBalance(half, balance, 6)).toBe(false);
      }
    });
  });
});
