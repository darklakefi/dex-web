import { describe, expect, it } from "vitest";
import {
  calculateLpTokensFromDeposit,
  calculateTokenAmountByPrice,
  calculateWithdrawalAmounts,
} from "../lpTokenCalculations";

describe("calculateLpTokensFromDeposit", () => {
  it("should return 1 for initial deposit", () => {
    const result = calculateLpTokensFromDeposit({
      reserveX: 0,
      reserveY: 0,
      tokenAAmount: "100",
      tokenBAmount: "200",
      totalLpSupply: 0,
    });

    expect(result.lpTokens).toBe("1");
    expect(result.lpTokensNumber).toBe(1);
  });

  it("should calculate LP tokens correctly for balanced deposit", () => {
    const result = calculateLpTokensFromDeposit({
      reserveX: 1000,
      reserveY: 2000,
      tokenAAmount: "100",
      tokenBAmount: "200",
      totalLpSupply: 1000,
    });

    expect(result.lpTokens).toBe("100");
    expect(result.lpTokensNumber).toBe(100);
  });

  it("should use minimum of both calculations", () => {
    const result = calculateLpTokensFromDeposit({
      reserveX: 1000,
      reserveY: 2000,
      tokenAAmount: "100",
      tokenBAmount: "150",
      totalLpSupply: 1000,
    });

    expect(result.lpTokensNumber).toBe(75);
  });

  it("should handle decimal amounts", () => {
    const result = calculateLpTokensFromDeposit({
      reserveX: 1000,
      reserveY: 2000,
      tokenAAmount: "123.456",
      tokenBAmount: "246.912",
      totalLpSupply: 1000,
    });

    expect(result.lpTokensNumber).toBeGreaterThan(0);
  });

  it("should handle amounts with commas", () => {
    const result = calculateLpTokensFromDeposit({
      reserveX: 10000,
      reserveY: 20000,
      tokenAAmount: "1,234.56",
      tokenBAmount: "2,469.12",
      totalLpSupply: 10000,
    });

    expect(result.lpTokensNumber).toBeGreaterThan(0);
  });
});

describe("calculateWithdrawalAmounts", () => {
  it("should calculate withdrawal amounts correctly", () => {
    const result = calculateWithdrawalAmounts({
      lpTokenAmount: "500",
      lpTokenDecimals: 6,
      reserveX: 1000000,
      reserveY: 2000000,
      totalLpSupply: 1000000000,
      userLpBalance: 1000000000,
    });

    expect(Number(result.tokenXAmount)).toBeCloseTo(500000, 0);
    expect(Number(result.tokenYAmount)).toBeCloseTo(1000000, 0);
    expect(result.percentage).toBe("50.00");
  });

  it("should handle 100% withdrawal", () => {
    const result = calculateWithdrawalAmounts({
      lpTokenAmount: "1000",
      lpTokenDecimals: 6,
      reserveX: 1000000,
      reserveY: 2000000,
      totalLpSupply: 1000000000,
      userLpBalance: 1000000000,
    });

    expect(result.percentage).toBe("100.00");
  });

  it("should handle small withdrawal amounts", () => {
    const result = calculateWithdrawalAmounts({
      lpTokenAmount: "0.01",
      lpTokenDecimals: 6,
      reserveX: 1000000,
      reserveY: 2000000,
      totalLpSupply: 1000000000,
      userLpBalance: 1000000000,
    });

    expect(Number(result.percentage)).toBeLessThan(1);
    expect(Number(result.tokenXAmount)).toBeGreaterThan(0);
  });

  it("should handle amounts with commas", () => {
    const result = calculateWithdrawalAmounts({
      lpTokenAmount: "1,234.56",
      lpTokenDecimals: 6,
      reserveX: 5000000,
      reserveY: 10000000,
      totalLpSupply: 10000000000,
      userLpBalance: 10000000000,
    });

    expect(Number(result.tokenXAmount)).toBeGreaterThan(0);
    expect(Number(result.tokenYAmount)).toBeGreaterThan(0);
  });
});

describe("calculateTokenAmountByPrice", () => {
  it("should calculate token amount by price", () => {
    const result = calculateTokenAmountByPrice({
      amount: "100",
      price: "2.5",
    });

    expect(result).toBe("250");
  });

  it("should handle decimal amounts", () => {
    const result = calculateTokenAmountByPrice({
      amount: "123.456",
      price: "1.5",
    });

    expect(result).toBe("185.184");
  });

  it("should return 0 for zero amount", () => {
    const result = calculateTokenAmountByPrice({
      amount: "0",
      price: "2.5",
    });

    expect(result).toBe("0");
  });

  it("should return 0 for zero price", () => {
    const result = calculateTokenAmountByPrice({
      amount: "100",
      price: "0",
    });

    expect(result).toBe("0");
  });

  it("should handle amounts with commas", () => {
    const result = calculateTokenAmountByPrice({
      amount: "1,234.56",
      price: "2.5",
    });

    expect(result).toBe("3086.4");
  });

  it("should handle very large numbers", () => {
    const result = calculateTokenAmountByPrice({
      amount: "999999999.999999",
      price: "1.5",
    });

    expect(Number(result)).toBeGreaterThan(1000000000);
  });
});
