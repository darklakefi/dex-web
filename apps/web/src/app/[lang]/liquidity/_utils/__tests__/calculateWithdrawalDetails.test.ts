import Decimal from "decimal.js";
import { describe, expect, it, vi } from "vitest";
import {
  calculateWithdrawalDetails,
  InputType,
} from "../calculateWithdrawalDetails";

vi.mock("@dex-web/utils", () => ({
  convertToDecimal: vi.fn((amount: number, decimals: number) => {
    return new Decimal(amount).div(new Decimal(10).pow(decimals));
  }),
  sortSolanaAddresses: vi.fn((tokenA: string, tokenB: string) => {
    const sorted = [tokenA, tokenB].sort();
    return {
      tokenXAddress: sorted[0],
      tokenYAddress: sorted[1],
    };
  }),
}));

describe("calculateWithdrawalDetails - Fixed Tests", () => {
  const mockUserLiquidity = {
    decimals: 6,
    lpTokenBalance: 1000000,
  };

  const mockPoolReserves = {
    reserveX: 1000000000,
    reserveY: 2000000000,
    totalLpSupply: 1000000000,
  };

  const mockTokenPrices = {
    tokenAPrice: { price: 1.5 },
    tokenBPrice: { price: 2.0 },
  };

  const baseParams = {
    poolReserves: mockPoolReserves,
    tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenAPrice: mockTokenPrices.tokenAPrice,
    tokenBAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    tokenBPrice: mockTokenPrices.tokenBPrice,
    userLiquidity: mockUserLiquidity,
  };

  describe("Basic withdrawal calculations", () => {
    it("should calculate withdrawal details for percentage input (50%)", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Percentage,
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
      expect(result.usdValue).toBeCloseTo(2.5, 2);
    });

    it("should calculate withdrawal details for absolute LP amount input", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Raw,
        withdrawalAmount: "500000",
      });

      expect(result.percentage).toBeCloseTo(50, 2);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
      expect(result.usdValue).toBeCloseTo(2.5, 2);
    });

    it("should calculate withdrawal details for 100% withdrawal", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Percentage,
        withdrawalAmount: "100",
      });

      expect(result.percentage).toBe(100);
      expect(result.tokenAAmount).toBeCloseTo(2, 2);
      expect(result.tokenBAmount).toBeCloseTo(1, 2);
      expect(result.usdValue).toBeCloseTo(5, 2);
    });

    it("should calculate withdrawal details for small percentage (1%)", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Percentage,
        withdrawalAmount: "1",
      });

      expect(result.percentage).toBe(1);
      expect(result.tokenAAmount).toBeCloseTo(0.02, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.01, 2);
      expect(result.usdValue).toBeCloseTo(0.05, 3);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should return zero values for null userLiquidity", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Percentage,
        userLiquidity: null,
        withdrawalAmount: "50",
      });

      expect(result).toEqual({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
    });

    it("should return zero values for null poolReserves", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Percentage,
        poolReserves: null,
        withdrawalAmount: "50",
      });

      expect(result).toEqual({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
    });

    it("should return zero values for empty withdrawal amount", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "",
      });

      expect(result).toEqual({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
    });

    it("should return zero values for zero totalLpSupply", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        poolReserves: { ...mockPoolReserves, totalLpSupply: 0 },
        withdrawalAmount: "50",
      });

      expect(result).toEqual({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
    });

    it("should handle negative withdrawal amounts", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "-50",
      });

      expect(result).toEqual({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
    });

    it("should handle invalid numeric input", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "invalid",
      });

      expect(result).toEqual({
        percentage: 0,
        tokenAAmount: 0,
        tokenBAmount: 0,
        usdValue: 0,
      });
    });

    it("should handle withdrawal amount with commas", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Raw,
        withdrawalAmount: "1,000,000",
      });

      expect(result.percentage).toBeCloseTo(100, 2);
      expect(result.tokenAAmount).toBeCloseTo(2, 2);
      expect(result.tokenBAmount).toBeCloseTo(1, 2);
    });
  });

  describe("Token ordering and address handling", () => {
    it("should handle different token address orders", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        tokenAAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
        tokenBAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(0.5, 2);
      expect(result.tokenBAmount).toBeCloseTo(1, 2);
      expect(result.usdValue).toBeCloseTo(2.75, 2);
    });
  });

  describe("Precision and rounding", () => {
    it("should handle very small withdrawal amounts", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "0.001",
      });

      expect(result.percentage).toBeCloseTo(0.001, 3);
      expect(result.tokenAAmount).toBeCloseTo(0.00002, 5);
      expect(result.tokenBAmount).toBeCloseTo(0.00001, 5);
      expect(result.usdValue).toBeCloseTo(0.00005, 6);
    });

    it("should handle decimal percentage inputs", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "25.5",
      });

      expect(result.percentage).toBeCloseTo(25.5, 1);
      expect(result.tokenAAmount).toBeCloseTo(0.51, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.255, 3);
    });
  });

  describe("Price calculations", () => {
    it("should handle zero token prices", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        tokenAPrice: { price: 0 },
        tokenBPrice: { price: 0 },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
      expect(result.usdValue).toBe(0);
    });

    it("should handle negative token prices", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        tokenAPrice: { price: -1.5 },
        tokenBPrice: { price: -2.0 },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
      expect(result.usdValue).toBeCloseTo(-2.5, 2);
    });
  });
});
