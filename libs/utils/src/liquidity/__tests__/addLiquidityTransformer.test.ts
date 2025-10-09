import { describe, expect, it } from "vitest";
import { transformAddLiquidityInput } from "../addLiquidityTransformer";
import type { AddLiquidityInput } from "../liquiditySchemas";

describe("transformAddLiquidityInput", () => {
  const createValidInput = (
    overrides: Partial<AddLiquidityInput> = {},
  ): AddLiquidityInput => ({
    poolReserves: {
      protocolFeeX: 0n,
      protocolFeeY: 0n,
      reserveX: 1000000000n,
      reserveY: 2000000000n,
      totalLpSupply: 1414213562n,
      userLockedX: 0n,
      userLockedY: 0n,
    },
    slippage: "0.5",
    tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenAAmount: "100",
    tokenADecimals: 6,
    tokenBAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    tokenBAmount: "200",
    tokenBDecimals: 6,
    userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    ...overrides,
  });

  describe("validation", () => {
    it("should transform valid input successfully", () => {
      const input = createValidInput();
      const result = transformAddLiquidityInput(input);

      expect(result).toHaveProperty("amountLp");
      expect(result).toHaveProperty("maxAmountX");
      expect(result).toHaveProperty("maxAmountY");
      expect(result).toHaveProperty("tokenMintX");
      expect(result).toHaveProperty("tokenMintY");
      expect(result).toHaveProperty("userAddress");
    });

    it("should reject invalid token addresses", () => {
      const input = createValidInput({ tokenAAddress: "invalid" });
      expect(() => transformAddLiquidityInput(input)).toThrow();
    });

    it("should reject negative amounts", () => {
      const input = createValidInput({ tokenAAmount: "-100" });
      expect(() => transformAddLiquidityInput(input)).toThrow();
    });

    it("should reject zero amounts", () => {
      const input = createValidInput({ tokenAAmount: "0" });
      expect(() => transformAddLiquidityInput(input)).toThrow();
    });

    it("should reject invalid slippage", () => {
      const input = createValidInput({ slippage: "-1" });
      expect(() => transformAddLiquidityInput(input)).toThrow();
    });
  });

  describe("token sorting", () => {
    it("should sort token addresses correctly", () => {
      const input = createValidInput();
      const result = transformAddLiquidityInput(input);

      // Addresses should be sorted lexicographically
      expect(result.tokenMintX < result.tokenMintY).toBe(true);
    });

    it("should maintain correct amounts after sorting", () => {
      const input = createValidInput({
        tokenAAmount: "100",
        tokenBAmount: "200",
      });
      const result = transformAddLiquidityInput(input);

      // With 6 decimals: 100 -> 100000000, 200 -> 200000000
      const totalMax = result.maxAmountX + result.maxAmountY;
      expect(totalMax > 300000000n).toBe(true); // Should include slippage
    });
  });

  describe("LP token calculation", () => {
    it("should calculate LP tokens for balanced pool", () => {
      const input = createValidInput({
        poolReserves: {
          protocolFeeX: 0n,
          protocolFeeY: 0n,
          reserveX: 1000000000n,
          reserveY: 2000000000n,
          totalLpSupply: 1414213562n,
          userLockedX: 0n,
          userLockedY: 0n,
        },
        tokenAAmount: "100",
        tokenBAmount: "200",
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });

    it("should calculate LP tokens for new pool", () => {
      const input = createValidInput({
        poolReserves: {
          protocolFeeX: 0n,
          protocolFeeY: 0n,
          reserveX: 0n,
          reserveY: 0n,
          totalLpSupply: 0n,
          userLockedX: 0n,
          userLockedY: 0n,
        },
        tokenAAmount: "100",
        tokenBAmount: "100",
      });

      const result = transformAddLiquidityInput(input);
      // sqrt(100 * 100) * 10^6 = 100 * 10^6 = 100000000
      expect(result.amountLp).toBe(100000000n);
    });

    it("should return positive LP tokens for valid inputs", () => {
      const input = createValidInput();
      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });
  });

  describe("slippage application", () => {
    it("should apply slippage to max amounts", () => {
      const input = createValidInput({
        slippage: "1",
        tokenAAmount: "100",
        tokenBAmount: "200", // 1%
      });

      const result = transformAddLiquidityInput(input);

      // With 1% slippage:
      // 100 * 10^6 * 1.01 = 101000000
      // 200 * 10^6 * 1.01 = 202000000
      expect(result.maxAmountX).toBeGreaterThanOrEqual(100000000n);
      expect(result.maxAmountY).toBeGreaterThanOrEqual(200000000n);
    });

    it("should handle zero slippage", () => {
      const input = createValidInput({
        slippage: "0",
        tokenAAmount: "100",
        tokenBAmount: "200",
      });

      const result = transformAddLiquidityInput(input);

      // With 0% slippage, max amounts should equal input amounts
      expect(result.maxAmountX).toBe(100000000n);
      expect(result.maxAmountY).toBe(200000000n);
    });

    it("should handle high slippage", () => {
      const input = createValidInput({
        slippage: "10",
        tokenAAmount: "100",
        tokenBAmount: "200", // 10%
      });

      const result = transformAddLiquidityInput(input);

      // With 10% slippage:
      // 100 * 10^6 * 1.10 = 110000000
      // 200 * 10^6 * 1.10 = 220000000
      expect(result.maxAmountX).toBe(110000000n);
      expect(result.maxAmountY).toBe(220000000n);
    });
  });

  describe("decimal handling", () => {
    it("should handle different token decimals", () => {
      const input = createValidInput({
        tokenAAmount: "100",
        tokenADecimals: 9,
        tokenBAmount: "200",
        tokenBDecimals: 6,
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });

    it("should handle 18 decimals", () => {
      const input = createValidInput({
        tokenAAmount: "1",
        tokenADecimals: 18,
        tokenBAmount: "1",
        tokenBDecimals: 18,
      });

      const result = transformAddLiquidityInput(input);
      expect(result.maxAmountX > 0n).toBe(true);
      expect(result.maxAmountY > 0n).toBe(true);
    });

    it("should handle 0 decimals", () => {
      const input = createValidInput({
        tokenAAmount: "100",
        tokenADecimals: 0,
        tokenBAmount: "200",
        tokenBDecimals: 0,
      });

      const result = transformAddLiquidityInput(input);
      expect(result.maxAmountX).toBeGreaterThanOrEqual(100n);
      expect(result.maxAmountY).toBeGreaterThanOrEqual(200n);
    });

    it("should handle fractional amounts", () => {
      const input = createValidInput({
        tokenAAmount: "100.5",
        tokenBAmount: "200.75",
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });
  });

  describe("payload structure", () => {
    it("should include all required fields", () => {
      const input = createValidInput();
      const result = transformAddLiquidityInput(input);

      expect(result).toHaveProperty(
        "$typeName",
        "darklake.v1.AddLiquidityRequest",
      );
      expect(result).toHaveProperty("amountLp");
      expect(result).toHaveProperty("label");
      expect(result).toHaveProperty("maxAmountX");
      expect(result).toHaveProperty("maxAmountY");
      expect(result).toHaveProperty("refCode");
      expect(result).toHaveProperty("tokenMintX");
      expect(result).toHaveProperty("tokenMintY");
      expect(result).toHaveProperty("userAddress");
    });

    it("should set default label and refCode", () => {
      const input = createValidInput();
      const result = transformAddLiquidityInput(input);

      expect(result.label).toBe("");
      expect(result.refCode).toBe("");
    });

    it("should preserve user address", () => {
      const input = createValidInput();
      const result = transformAddLiquidityInput(input);

      expect(result.userAddress).toBe(input.userAddress);
    });
  });

  describe("edge cases", () => {
    it("should handle very small amounts", () => {
      const input = createValidInput({
        tokenAAmount: "0.000001",
        tokenBAmount: "0.000002",
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp).toBeGreaterThanOrEqual(0n);
    });

    it("should handle very large amounts", () => {
      const input = createValidInput({
        tokenAAmount: "1000000000",
        tokenBAmount: "2000000000",
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });

    it("should handle amounts with commas", () => {
      const input = createValidInput({
        tokenAAmount: "1,000.5",
        tokenBAmount: "2,000.75",
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });

    it("should handle amounts with leading/trailing whitespace", () => {
      const input = createValidInput({
        tokenAAmount: "  100  ",
        tokenBAmount: "  200  ",
      });

      const result = transformAddLiquidityInput(input);
      expect(result.amountLp > 0n).toBe(true);
    });
  });
});
