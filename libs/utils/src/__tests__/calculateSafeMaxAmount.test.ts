import { describe, expect, it } from "vitest";
import { calculateSafeMaxAmount } from "../calculateSafeMaxAmount";

describe("calculateSafeMaxAmount", () => {
  describe("basic functionality", () => {
    it("should return full precision amount when maxDecimals is not specified", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234567890n,
        decimals: 6,
      });
      expect(result).toBe("1234.56789");
    });

    it("should truncate to maxDecimals when specified", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234567890n,
        decimals: 6,
        maxDecimals: 2,
      });
      expect(result).toBe("1234.56");
    });

    it("should handle amounts with fewer decimals than maxDecimals", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234000000n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1234");
    });

    it("should handle zero amount", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 0n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("0");
    });
  });

  describe("precision edge cases", () => {
    it("should truncate exactly at maxDecimals boundary", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 274402754340000n,
        decimals: 9,
        maxDecimals: 5,
      });
      expect(result).toBe("274402.75434");
    });

    it("should handle amount with exactly maxDecimals precision", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 100000000n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("100");
    });

    it("should not add trailing zeros when truncating", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1500000n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1.5");
    });

    it("should handle very large amounts", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 62276892331080000n,
        decimals: 9,
        maxDecimals: 5,
      });
      expect(result).toBe("62276892.33108");
    });
  });

  describe("different decimal configurations", () => {
    it("should handle SOL (9 decimals)", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1000000000n,
        decimals: 9,
        maxDecimals: 5,
      });
      expect(result).toBe("1");
    });

    it("should handle USDC (6 decimals)", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1000000n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1");
    });

    it("should handle tokens with 0 decimals", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 100n,
        decimals: 0,
        maxDecimals: 5,
      });
      expect(result).toBe("100");
    });

    it("should handle tokens with 18 decimals (like ETH)", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1500000000000000000n,
        decimals: 18,
        maxDecimals: 5,
      });
      expect(result).toBe("1.5");
    });
  });

  describe("maxDecimals edge cases", () => {
    it("should handle maxDecimals = 0", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234567n,
        decimals: 6,
        maxDecimals: 0,
      });
      expect(result).toBe("1");
    });

    it("should handle maxDecimals larger than token decimals", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234567n,
        decimals: 6,
        maxDecimals: 10,
      });
      expect(result).toBe("1.234567");
    });

    it("should not add extra zeros when maxDecimals > actual decimals", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1500000n,
        decimals: 6,
        maxDecimals: 10,
      });
      expect(result).toBe("1.5");
    });
  });

  describe("validation safety", () => {
    it("should return amount that passes balance validation", () => {
      const balance = 274402754340000n;
      const decimals = 9;
      const maxDecimals = 5;

      const result = calculateSafeMaxAmount({
        atomicAmount: balance,
        decimals,
        maxDecimals,
      });

      const resultAtomic = BigInt(Math.floor(Number(result) * 10 ** decimals));
      expect(resultAtomic).toBeLessThanOrEqual(balance);
    });

    it("should ensure result never exceeds original balance", () => {
      const testCases = [
        { atomicAmount: 1234567890n, decimals: 6, maxDecimals: 5 },
        { atomicAmount: 999999999n, decimals: 9, maxDecimals: 5 },
        { atomicAmount: 1n, decimals: 6, maxDecimals: 5 },
        { atomicAmount: 123456789012345678n, decimals: 18, maxDecimals: 5 },
      ];

      for (const testCase of testCases) {
        const result = calculateSafeMaxAmount(testCase);
        const resultAtomic = BigInt(
          Math.floor(Number(result) * 10 ** testCase.decimals),
        );
        expect(resultAtomic).toBeLessThanOrEqual(testCase.atomicAmount);
      }
    });
  });

  describe("real-world scenarios", () => {
    it("should handle the exact scenario from the bug report", () => {
      const dukyResult = calculateSafeMaxAmount({
        atomicAmount: 274402754340000n,
        decimals: 9,
        maxDecimals: 5,
      });
      expect(dukyResult).toBe("274402.75434");

      const duxResult = calculateSafeMaxAmount({
        atomicAmount: 62276892331080000n,
        decimals: 9,
        maxDecimals: 5,
      });
      expect(duxResult).toBe("62276892.33108");
    });

    it("should handle proportional amounts that need capping", () => {
      const balance = 524675845830000n;
      const result = calculateSafeMaxAmount({
        atomicAmount: balance,
        decimals: 9,
        maxDecimals: 5,
      });
      expect(result).toBe("524675.84583");
    });
  });

  describe("type handling", () => {
    it("should accept number type for atomicAmount", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234567,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1.23456");
    });

    it("should handle bigint type for atomicAmount", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234567n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1.23456");
    });
  });

  describe("string output format", () => {
    it("should return string without trailing zeros", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1000000n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1");
      expect(typeof result).toBe("string");
    });

    it("should return string with necessary decimal places", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1234560n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).toBe("1.23456");
      expect(typeof result).toBe("string");
    });

    it("should not use scientific notation for large numbers", () => {
      const result = calculateSafeMaxAmount({
        atomicAmount: 1000000000000000n,
        decimals: 6,
        maxDecimals: 5,
      });
      expect(result).not.toMatch(/e/i);
      expect(result).toBe("1000000000");
    });
  });
});
