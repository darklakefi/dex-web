import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  applySlippageToMax,
  parseAmountSafe,
  toRawUnits,
} from "../liquidityParsers";

describe("liquidityParsers", () => {
  describe("parseAmountSafe", () => {
    it("should parse valid numeric strings", () => {
      const result = parseAmountSafe("123.456");
      expect(result.toString()).toBe("123.456");
    });

    it("should handle comma separators", () => {
      const result = parseAmountSafe("1,234.56");
      expect(result.toString()).toBe("1234.56");
    });

    it("should handle large numbers", () => {
      const result = parseAmountSafe("1,000,000.123456");
      expect(result.toString()).toBe("1000000.123456");
    });

    it("should trim whitespace", () => {
      const result = parseAmountSafe("  100.5  ");
      expect(result.toString()).toBe("100.5");
    });

    it("should throw error for invalid amounts", () => {
      expect(() => parseAmountSafe("invalid")).toThrow("Invalid amount");
    });

    it("should throw error for zero", () => {
      expect(() => parseAmountSafe("0")).toThrow("Invalid amount: 0");
    });

    it("should throw error for negative amounts", () => {
      expect(() => parseAmountSafe("-100")).toThrow("Invalid amount: -100");
    });

    it("should throw error for empty string", () => {
      expect(() => parseAmountSafe("")).toThrow();
    });
  });

  describe("toRawUnits", () => {
    it("should convert amount to raw units with decimals", () => {
      const amount = new Decimal("100.5");
      const result = toRawUnits(amount, 6);
      expect(result).toBe(100500000n);
    });

    it("should handle zero decimals", () => {
      const amount = new Decimal("100");
      const result = toRawUnits(amount, 0);
      expect(result).toBe(100n);
    });

    it("should handle 18 decimals (ETH-like)", () => {
      const amount = new Decimal("1.5");
      const result = toRawUnits(amount, 18);
      expect(result).toBe(1500000000000000000n);
    });

    it("should round down fractional raw units", () => {
      const amount = new Decimal("0.123456789");
      const result = toRawUnits(amount, 6);
      expect(result).toBe(123456n);
    });

    it("should handle very small amounts", () => {
      const amount = new Decimal("0.000001");
      const result = toRawUnits(amount, 6);
      expect(result).toBe(1n);
    });

    it("should handle amounts smaller than smallest unit", () => {
      const amount = new Decimal("0.0000001");
      const result = toRawUnits(amount, 6);
      expect(result).toBe(0n);
    });
  });

  describe("applySlippageToMax", () => {
    it("should add slippage to amount", () => {
      const amount = new Decimal("1000");
      const slippage = new Decimal("0.5");
      const result = applySlippageToMax(amount, slippage);
      expect(result.toString()).toBe("1005");
    });

    it("should handle 1% slippage", () => {
      const amount = new Decimal("100");
      const slippage = new Decimal("1");
      const result = applySlippageToMax(amount, slippage);
      expect(result.toString()).toBe("101");
    });

    it("should handle 5% slippage", () => {
      const amount = new Decimal("200");
      const slippage = new Decimal("5");
      const result = applySlippageToMax(amount, slippage);
      expect(result.toString()).toBe("210");
    });

    it("should handle zero slippage", () => {
      const amount = new Decimal("1000");
      const slippage = new Decimal("0");
      const result = applySlippageToMax(amount, slippage);
      expect(result.toString()).toBe("1000");
    });

    it("should maintain precision for small amounts", () => {
      const amount = new Decimal("0.1");
      const slippage = new Decimal("0.5");
      const result = applySlippageToMax(amount, slippage);
      expect(result.toString()).toBe("0.1005");
    });
  });
});
