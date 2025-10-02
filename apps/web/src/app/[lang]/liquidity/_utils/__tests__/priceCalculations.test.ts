import { describe, expect, it, vi } from "vitest";
import { calculateTokenAmountByPrice } from "../liquidityCalculations";

vi.mock("@dex-web/utils", () => ({
  parseAmountBigNumber: vi.fn((amount: string) => {
    const cleanAmount = amount.replace(/,/g, "").trim();
    const num = parseFloat(cleanAmount);
    return {
      gt: (value: number) => num > value,
      multipliedBy: (multiplier: string) => ({
        toString: () => (num * parseFloat(multiplier)).toString(),
      }),
    };
  }),
}));

describe("calculateTokenAmountByPrice", () => {
  describe("Basic price calculations", () => {
    it("should calculate correct amount with valid inputs", () => {
      const result = calculateTokenAmountByPrice("100", "1.5");
      expect(result).toBe("150");
    });

    it("should calculate with decimal inputs", () => {
      const result = calculateTokenAmountByPrice("100.5", "2.25");
      expect(result).toBe("226.125");
    });

    it("should calculate with very small amounts", () => {
      const result = calculateTokenAmountByPrice("0.001", "1000");
      expect(result).toBe("1");
    });

    it("should calculate with very large amounts", () => {
      const result = calculateTokenAmountByPrice("1000000", "0.5");
      expect(result).toBe("500000");
    });

    it("should handle high precision prices", () => {
      const result = calculateTokenAmountByPrice("100", "1.23456789");
      expect(result).toBe("123.45678899999999");
    });
  });

  describe("Edge cases", () => {
    it('should return "0" for zero input amount', () => {
      const result = calculateTokenAmountByPrice("0", "1.5");
      expect(result).toBe("0");
    });

    it('should return "0" for zero price', () => {
      const result = calculateTokenAmountByPrice("100", "0");
      expect(result).toBe("0");
    });

    it('should return "0" for negative input amount', () => {
      const result = calculateTokenAmountByPrice("-100", "1.5");
      expect(result).toBe("0");
    });

    it('should return "0" for negative price', () => {
      const result = calculateTokenAmountByPrice("100", "-1.5");
      expect(result).toBe("0");
    });

    it('should return "0" for both zero inputs', () => {
      const result = calculateTokenAmountByPrice("0", "0");
      expect(result).toBe("0");
    });

    it('should return "0" for both negative inputs', () => {
      const result = calculateTokenAmountByPrice("-100", "-1.5");
      expect(result).toBe("0");
    });
  });

  describe("String input handling", () => {
    it("should handle string numbers with spaces", () => {
      const result = calculateTokenAmountByPrice(" 100 ", " 1.5 ");
      expect(result).toBe("150");
    });

    it("should handle scientific notation", () => {
      const result = calculateTokenAmountByPrice("1e3", "2.5");
      expect(result).toBe("2500");
    });

    it("should handle very small scientific notation", () => {
      const result = calculateTokenAmountByPrice("1e-6", "1000000");
      expect(result).toBe("1");
    });
  });

  describe("Precision and rounding", () => {
    it("should maintain precision for small amounts", () => {
      const result = calculateTokenAmountByPrice("0.000001", "1000000");
      expect(result).toBe("1");
    });

    it("should handle very precise calculations", () => {
      const result = calculateTokenAmountByPrice("1.23456789", "9.87654321");
      expect(result).toBe("12.193263111263525");
    });

    it("should handle large numbers with precision", () => {
      const result = calculateTokenAmountByPrice("999999999.99", "0.000001");
      expect(result).toBe("999.99999999");
    });
  });

  describe("Boundary conditions", () => {
    it("should handle maximum safe integer", () => {
      const maxSafe = Number.MAX_SAFE_INTEGER.toString();
      const result = calculateTokenAmountByPrice(maxSafe, "1");
      expect(result).toBe(maxSafe);
    });

    it("should handle very small positive numbers", () => {
      const result = calculateTokenAmountByPrice("0.0000000001", "10000000000");
      expect(result).toBe("1");
    });

    it("should handle very large price multipliers", () => {
      const result = calculateTokenAmountByPrice("1", "999999999999");
      expect(result).toBe("999999999999");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid string inputs gracefully", () => {
      const result = calculateTokenAmountByPrice("invalid", "1.5");
      expect(result).toBe("0");
    });

    it("should handle NaN inputs", () => {
      const result = calculateTokenAmountByPrice("NaN", "1.5");
      expect(result).toBe("0");
    });

    it("should handle Infinity inputs", () => {
      const result = calculateTokenAmountByPrice("Infinity", "1.5");
      expect(result).toBe("Infinity");
    });
  });

  describe("Real-world scenarios", () => {
    it("should calculate USDC to SOL conversion", () => {
      const result = calculateTokenAmountByPrice("100", "150");
      expect(result).toBe("15000");
    });

    it("should calculate SOL to USDC conversion", () => {
      const result = calculateTokenAmountByPrice("1", "150");
      expect(result).toBe("150");
    });

    it("should calculate with market price fluctuations", () => {
      const prices = ["1.2345", "1.2346", "1.2344"];
      const results = prices.map((price) =>
        calculateTokenAmountByPrice("1000", price),
      );

      expect(results[0]).toBe("1234.5");
      expect(results[1]).toBe("1234.6");
      expect(results[2]).toBe("1234.3999999999999");
    });

    it("should handle token with many decimals", () => {
      const result = calculateTokenAmountByPrice("0.000000001", "1000000000");
      expect(result).toBe("1");
    });
  });
});
