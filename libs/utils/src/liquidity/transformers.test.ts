import { describe, expect, it, vi } from "vitest";
import { transformToAddLiquidityPayload } from "./transformers";

const WSOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USER = "BXqAmer56m2vNvEFpfG6pBSdRM6JvJ2GeBq3kArGr3Jn";

describe("transformToAddLiquidityPayload", () => {
  describe("basic transformation", () => {
    it("should transform form data to add liquidity payload with all required fields", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "1",
        tokenBAddress: USDC,
        tokenBAmount: "2",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      expect(result).toHaveProperty("tokenMintX");
      expect(result).toHaveProperty("tokenMintY");
      expect(result).toHaveProperty("maxAmountX");
      expect(result).toHaveProperty("maxAmountY");
      expect(result).toHaveProperty("amountLp");
      expect(result.userAddress).toBe(USER);
      expect(result.label).toBe("");
      expect(result.refCode).toBe("");
    });

    it("should handle string amounts with decimals", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "2",
        tokenBAddress: USDC,
        tokenBAmount: "4",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.maxAmountX).toBeGreaterThan(BigInt(0));
      expect(result.maxAmountY).toBeGreaterThan(BigInt(0));
    });

    it("should handle zero amounts", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(0),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "0",
        tokenBAddress: USDC,
        tokenBAmount: "0",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      expect(result.maxAmountX).toBe(BigInt(0));
      expect(result.maxAmountY).toBe(BigInt(0));
      expect(result.amountLp).toBe(BigInt(0));
    });
  });

  describe("slippage application", () => {
    it("should apply 0.5% slippage correctly", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "2",
        tokenAAddress: WSOL,
        tokenAAmount: "1000",
        tokenBAddress: USDC,
        tokenBAmount: "1000",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      const expectedWithSlippage = BigInt(1020000000);
      expect(result.maxAmountX).toBe(expectedWithSlippage);
      expect(result.maxAmountY).toBe(expectedWithSlippage);
    });

    it("should apply 1% slippage correctly", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "100",
        tokenBAddress: USDC,
        tokenBAmount: "100",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      const expectedWithSlippage = BigInt(101000000);
      expect(result.maxAmountX).toBe(expectedWithSlippage);
      expect(result.maxAmountY).toBe(expectedWithSlippage);
    });

    it("should apply 5% slippage correctly", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "5",
        tokenAAddress: WSOL,
        tokenAAmount: "1000",
        tokenBAddress: USDC,
        tokenBAmount: "1000",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      const expectedWithSlippage = BigInt(1050000000);
      expect(result.maxAmountX).toBe(expectedWithSlippage);
      expect(result.maxAmountY).toBe(expectedWithSlippage);
    });

    it("should handle zero slippage", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0",
        tokenAAddress: WSOL,
        tokenAAmount: "100",
        tokenBAddress: USDC,
        tokenBAmount: "100",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      const expectedAmount = BigInt(100000000);
      expect(result.maxAmountX).toBe(expectedAmount);
      expect(result.maxAmountY).toBe(expectedAmount);
    });
  });

  describe("token sorting", () => {
    it("should sort tokens in canonical order", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "1",
        tokenBAddress: USDC,
        tokenBAmount: "1",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      expect(typeof result.tokenMintX).toBe("string");
      expect(typeof result.tokenMintY).toBe("string");
      expect(result.tokenMintX.length).toBeGreaterThan(0);
      expect(result.tokenMintY.length).toBeGreaterThan(0);
    });

    it("should return consistent order regardless of input order", () => {
      const result1 = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "1",
        tokenBAddress: USDC,
        tokenBAmount: "1",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      const result2 = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: USDC,
        tokenAAmount: "1",
        tokenBAddress: WSOL,
        tokenBAmount: "1",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      expect(result1.tokenMintX).toBe(result2.tokenMintX);
      expect(result1.tokenMintY).toBe(result2.tokenMintY);
    });
  });

  describe("token mapping based on pool order", () => {
    it("should map tokenB as X when poolTokenXMint matches tokenBAddress", () => {
      const calculateLpTokens = vi.fn().mockReturnValue(BigInt(5000000000));

      transformToAddLiquidityPayload({
        calculateLpTokens,
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "100",
        tokenBAddress: USDC,
        tokenBAmount: "200",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      expect(calculateLpTokens).toHaveBeenCalledWith(
        expect.closeTo(198, 1),
        expect.closeTo(99, 1),
      );
    });

    it("should map tokenA as X when poolTokenXMint matches tokenAAddress", () => {
      const calculateLpTokens = vi.fn().mockReturnValue(BigInt(5000000000));

      transformToAddLiquidityPayload({
        calculateLpTokens,
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: USDC,
        tokenAAmount: "200",
        tokenBAddress: WSOL,
        tokenBAmount: "100",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: USER,
      });

      expect(calculateLpTokens).toHaveBeenCalledWith(
        expect.closeTo(198, 1),
        expect.closeTo(99, 1),
      );
    });
  });

  describe("decimal handling", () => {
    it("should handle different decimal places for tokenX", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "1",
        tokenBAddress: USDC,
        tokenBAmount: "1",
        tokenXDecimals: 9,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.maxAmountX.toString().length).toBeGreaterThanOrEqual(9);
    });

    it("should handle different decimal places for tokenY", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "1",
        tokenBAddress: USDC,
        tokenBAmount: "1",
        tokenXDecimals: 6,
        tokenYDecimals: 18,
        userAddress: USER,
      });

      expect(result.maxAmountY.toString().length).toBeGreaterThanOrEqual(18);
    });

    it("should handle 0 decimal tokens", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "20",
        tokenAAddress: WSOL,
        tokenAAmount: "1000",
        tokenBAddress: USDC,
        tokenBAmount: "1000",
        tokenXDecimals: 0,
        tokenYDecimals: 0,
        userAddress: USER,
      });

      expect(result.maxAmountX).toBe(BigInt(1200));
      expect(result.maxAmountY).toBe(BigInt(1200));
    });
  });

  describe("LP token calculation", () => {
    it("should call calculateLpTokens with slippage-reduced amounts", () => {
      const calculateLpTokens = vi.fn().mockReturnValue(BigInt(1000000000));

      transformToAddLiquidityPayload({
        calculateLpTokens,
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "100",
        tokenBAddress: USDC,
        tokenBAmount: "100",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(calculateLpTokens).toHaveBeenCalledWith(
        expect.closeTo(99, 0.1),
        expect.closeTo(99, 0.1),
      );
    });

    it("should use the returned LP token amount in payload", () => {
      const expectedLpAmount = BigInt(5000000000);
      const calculateLpTokens = vi.fn().mockReturnValue(expectedLpAmount);

      const result = transformToAddLiquidityPayload({
        calculateLpTokens,
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "100",
        tokenBAddress: USDC,
        tokenBAmount: "100",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.amountLp).toBe(expectedLpAmount);
    });

    it("should handle large LP token amounts", () => {
      const largeLpAmount = BigInt("999999999999999999");
      const calculateLpTokens = vi.fn().mockReturnValue(largeLpAmount);

      const result = transformToAddLiquidityPayload({
        calculateLpTokens,
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "1000000",
        tokenBAddress: USDC,
        tokenBAmount: "1000000",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.amountLp).toBe(largeLpAmount);
    });
  });

  describe("edge cases", () => {
    it("should handle very small amounts", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1),
        poolTokenXMint: USDC,
        slippage: "10",
        tokenAAddress: WSOL,
        tokenAAmount: "0.001",
        tokenBAddress: USDC,
        tokenBAmount: "0.001",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.maxAmountX).toBeGreaterThan(BigInt(0));
      expect(result.maxAmountY).toBeGreaterThan(BigInt(0));
    });

    it("should handle large amounts", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000000),
        poolTokenXMint: USDC,
        slippage: "1",
        tokenAAddress: WSOL,
        tokenAAmount: "1000000",
        tokenBAddress: USDC,
        tokenBAmount: "1000000",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.maxAmountX).toBeGreaterThan(BigInt(1000000000000));
      expect(result.maxAmountY).toBeGreaterThan(BigInt(1000000000000));
    });

    it("should handle empty label and refCode", () => {
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: WSOL,
        tokenAAmount: "1",
        tokenBAddress: USDC,
        tokenBAmount: "1",
        tokenXDecimals: 6,
        tokenYDecimals: 6,
        userAddress: USER,
      });

      expect(result.label).toBe("");
      expect(result.refCode).toBe("");
    });

    it("should handle precision issues with slippage calculations", () => {
      // Test case for the specific error: Amount 41580443.84035831 with 6 decimals results in non-integer
      const result = transformToAddLiquidityPayload({
        calculateLpTokens: () => BigInt(1000000000),
        poolTokenXMint: USDC,
        slippage: "0.5",
        tokenAAddress: USDC,
        tokenAAmount: "41580443.84035831",
        tokenBAddress: WSOL, // This was causing the precision error
        tokenBAmount: "1000000",
        tokenXDecimals: 6,
        tokenYDecimals: 9,
        userAddress: "user123",
      });

      // Should not throw an error and should return valid bigints
      expect(result.maxAmountX).toBeDefined();
      expect(result.maxAmountY).toBeDefined();
      expect(typeof result.maxAmountX).toBe("bigint");
      expect(typeof result.maxAmountY).toBe("bigint");
    });
  });
});
