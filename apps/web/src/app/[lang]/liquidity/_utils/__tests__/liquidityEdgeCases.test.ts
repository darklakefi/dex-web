import Decimal from "decimal.js";
import { describe, expect, it, vi } from "vitest";
import {
  calculateWithdrawalDetails,
  InputType,
} from "../calculateWithdrawalDetails";
import {
  calculateLiquidityAmounts,
  determineInputType,
} from "../liquidityCalculations";

vi.mock("@dex-web/utils", () => ({
  convertToDecimal: vi.fn((amount: number, decimals: number) => {
    return new Decimal(amount).div(new Decimal(10).pow(decimals));
  }),
  parseAmount: vi.fn((amount: string) => Number(amount)),
  parseAmountBigNumber: vi.fn((amount: string) => ({
    gt: vi.fn((value: number) => Number(amount) > value),
    multipliedBy: vi.fn((multiplier: string) => ({
      toString: () => (Number(amount) * Number(multiplier)).toString(),
    })),
  })),
  sortSolanaAddresses: vi.fn((tokenA: string, tokenB: string) => {
    const sorted = [tokenA, tokenB].sort();
    return {
      tokenXAddress: sorted[0],
      tokenYAddress: sorted[1],
    };
  }),
}));

describe("Liquidity Edge Cases", () => {
  describe("calculateLiquidityAmounts edge cases", () => {
    const mockPoolDetails = {
      tokenXMint: "tokenX123",
      tokenYMint: "tokenY456",
    };

    it("should handle extremely large amounts", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "999999999999", tokenBAmount: "999999999999" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenX123" },
      );

      expect(result.maxAmountX).toBe(999999999999);
      expect(result.maxAmountY).toBe(999999999999);
    });

    it("should handle very small amounts", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "0.000001", tokenBAmount: "0.000001" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenX123" },
      );

      expect(result.maxAmountX).toBe(0.000001);
      expect(result.maxAmountY).toBe(0.000001);
    });

    it("should handle zero amounts", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "0", tokenBAmount: "0" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenB987" },
      );

      expect(result.maxAmountX).toBe(0);
      expect(result.maxAmountY).toBe(0);
    });

    it("should handle mixed zero and non-zero amounts", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "100", tokenBAmount: "0" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenX123" },
      );

      expect(result.maxAmountX).toBe(0);
      expect(result.maxAmountY).toBe(100);
    });

    it("should handle decimal amounts with many decimal places", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "123.456789012345", tokenBAmount: "987.654321098765" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenX123" },
      );

      expect(result.maxAmountX).toBe(987.654321098765);
      expect(result.maxAmountY).toBe(123.456789012345);
    });
  });

  describe("determineInputType edge cases", () => {
    const mockPoolDetails = {
      tokenXMint: "tokenX123",
      tokenYMint: "tokenY456",
    };

    it("should handle null pool details", () => {
      const result = determineInputType("buy", null, "tokenA", "tokenB");
      expect(result).toBe("tokenX");
    });

    it("should handle null token addresses", () => {
      const result = determineInputType("buy", mockPoolDetails, null, null);
      expect(result).toBe("tokenY");
    });

    it("should handle undefined token addresses", () => {
      const result = determineInputType(
        "sell",
        mockPoolDetails,
        undefined,
        undefined,
      );
      expect(result).toBe("tokenY");
    });

    it("should handle empty string token addresses", () => {
      const result = determineInputType("buy", mockPoolDetails, "", "");
      expect(result).toBe("tokenY");
    });

    it("should handle identical token addresses", () => {
      const result = determineInputType(
        "buy",
        mockPoolDetails,
        "tokenX123",
        "tokenX123",
      );
      expect(result).toBe("tokenX");
    });

    it("should handle very long token addresses", () => {
      const longAddress = "A".repeat(100);
      const result = determineInputType(
        "sell",
        mockPoolDetails,
        longAddress,
        "tokenY456",
      );
      expect(result).toBe("tokenY");
    });
  });

  describe("calculateWithdrawalDetails edge cases", () => {
    const mockUserLiquidity = {
      decimals: 6, // 1 LP token with 6 decimals
      lpTokenBalance: 1000000,
    };

    const mockPoolReserves = {
      reserveX: 1000000000, // 1000 tokens with 6 decimals
      reserveY: 2000000000, // 2000 tokens with 6 decimals
      totalLpSupply: 1000000000, // 1000 LP tokens with 6 decimals
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

    it("should handle withdrawal amount exceeding user balance", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "2000000", // 2 LP tokens (user only has 1)
      });

      expect(result.percentage).toBeGreaterThan(100);
      expect(result.tokenAAmount).toBeGreaterThan(1000);
      expect(result.tokenBAmount).toBeGreaterThan(2000);
    });

    it("should handle very small withdrawal amounts", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "0.000001", // 0.000001%
      });

      expect(result.percentage).toBeCloseTo(0.000001, 6);
      expect(result.tokenAAmount).toBeCloseTo(0.00001, 4);
      expect(result.tokenBAmount).toBeCloseTo(0.00002, 4);
    });

    it("should handle withdrawal amount with many decimal places", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "33.333333333333",
      });

      expect(result.percentage).toBeCloseTo(33.333333333333, 10);
      expect(result.tokenAAmount).toBeCloseTo(0.66666666666666, 10);
      expect(result.tokenBAmount).toBeCloseTo(0.33333333333333, 10);
    });

    it("should handle withdrawal amount with scientific notation", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        withdrawalAmount: "1e-6", // 0.000001%
      });

      expect(result.percentage).toBeCloseTo(0.000001, 6);
      expect(result.tokenAAmount).toBeCloseTo(0.00001, 4);
      expect(result.tokenBAmount).toBeCloseTo(0.00002, 4);
    });

    it("should handle withdrawal amount with commas and spaces", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        inputType: InputType.Raw,
        withdrawalAmount: " 1,000,000.50 ",
      });

      expect(result.percentage).toBeCloseTo(0, 5);
      expect(result.tokenAAmount).toBeCloseTo(0, 4);
      expect(result.tokenBAmount).toBeCloseTo(0, 3);
    });

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

    it("should handle very high token prices", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        tokenAPrice: { price: 1e10 },
        tokenBPrice: { price: 1e10 },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
      expect(result.usdValue).toBeCloseTo(1.5e10, 0);
    });

    it("should handle very small token prices", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        tokenAPrice: { price: 1e-10 },
        tokenBPrice: { price: 1e-10 },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
      expect(result.usdValue).toBeCloseTo(1.5e-10, 8);
    });

    it("should handle pool reserves with very small values", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        poolReserves: {
          reserveX: 1,
          reserveY: 1,
          totalLpSupply: 1000000,
        },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(5e-7, 6);
      expect(result.tokenBAmount).toBeCloseTo(5e-7, 6);
    });

    it("should handle pool reserves with very large values", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        poolReserves: {
          reserveX: 1e15,
          reserveY: 2e15,
          totalLpSupply: 1e12,
        },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1000, 0);
      expect(result.tokenBAmount).toBeCloseTo(500, 0);
    });

    it("should handle user liquidity with zero balance", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        userLiquidity: {
          decimals: 6,
          lpTokenBalance: 0,
        },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBe(0);
      expect(result.tokenBAmount).toBe(0);
      expect(result.usdValue).toBe(0);
    });

    it("should handle user liquidity with very small balance", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        userLiquidity: {
          decimals: 6,
          lpTokenBalance: 1,
        },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1e-6, 6);
      expect(result.tokenBAmount).toBeCloseTo(5e-7, 6);
    });

    it("should handle different decimal precisions", () => {
      const result = calculateWithdrawalDetails({
        ...baseParams,
        poolReserves: {
          reserveX: 1000000000000,
          reserveY: 2000000000000,
          totalLpSupply: 1000000000000,
        },
        userLiquidity: {
          decimals: 9,
          lpTokenBalance: 1000000000,
        },
        withdrawalAmount: "50",
      });

      expect(result.percentage).toBe(50);
      expect(result.tokenAAmount).toBeCloseTo(1, 2);
      expect(result.tokenBAmount).toBeCloseTo(0.5, 2);
    });
  });

  describe("Boundary value testing", () => {
    it("should handle maximum safe integer values", () => {
      const maxSafe = Number.MAX_SAFE_INTEGER.toString();
      const result = calculateLiquidityAmounts(
        { tokenXMint: "tokenX", tokenYMint: "tokenY" },
        { tokenAAmount: maxSafe, tokenBAmount: maxSafe },
        { tokenAAddress: "tokenA", tokenBAddress: "tokenX" },
      );

      expect(result.maxAmountX).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.maxAmountY).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("should handle minimum safe integer values", () => {
      const minSafe = Number.MIN_SAFE_INTEGER.toString();
      const result = calculateLiquidityAmounts(
        { tokenXMint: "tokenX", tokenYMint: "tokenY" },
        { tokenAAmount: minSafe, tokenBAmount: minSafe },
        { tokenAAddress: "tokenA", tokenBAddress: "tokenX" },
      );

      expect(result.maxAmountX).toBe(Number.MIN_SAFE_INTEGER);
      expect(result.maxAmountY).toBe(Number.MIN_SAFE_INTEGER);
    });
  });
});
