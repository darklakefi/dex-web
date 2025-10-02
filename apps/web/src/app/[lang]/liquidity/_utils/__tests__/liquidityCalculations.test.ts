import { parseAmountBigNumber, sortSolanaAddresses } from "@dex-web/utils";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";
import {
  calculateLiquidityAmounts,
  calculateTokenAmountByPrice,
  createLiquidityTransactionPayload,
  determineInputType,
} from "../liquidityCalculations";

vi.mock("@dex-web/utils", () => ({
  parseAmount: vi.fn((amount: string) => Number(amount)),
  parseAmountBigNumber: vi.fn((amount: string) => ({
    gt: vi.fn((value: number) => Number(amount) > value),
    multipliedBy: vi.fn((multiplier: string) => ({
      toString: () => (Number(amount) * Number(multiplier)).toString(),
    })),
  })),
  sortSolanaAddresses: vi.fn((tokenA: string, tokenB: string) => ({
    tokenXAddress: tokenA,
    tokenYAddress: tokenB,
  })),
}));
describe("liquidityCalculations", () => {
  describe("calculateLiquidityAmounts", () => {
    const mockPoolDetails = {
      tokenXMint: "tokenX123",
      tokenYMint: "tokenY456",
    };
    it("should calculate amounts when tokenB is tokenX (sell)", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "100", tokenBAmount: "200" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenX123" },
      );
      expect(result).toEqual({
        maxAmountX: 200,
        maxAmountY: 100,
      });
    });
    it("should calculate amounts when tokenA is tokenX (buy)", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "100", tokenBAmount: "200" },
        { tokenAAddress: "tokenX123", tokenBAddress: "tokenY456" },
      );
      expect(result).toEqual({
        maxAmountX: 100,
        maxAmountY: 200,
      });
    });
    it("should handle zero amounts", () => {
      const result = calculateLiquidityAmounts(
        mockPoolDetails,
        { tokenAAmount: "0", tokenBAmount: "0" },
        { tokenAAddress: "tokenA789", tokenBAddress: "tokenB987" },
      );
      expect(result).toEqual({
        maxAmountX: 0,
        maxAmountY: 0,
      });
    });
  });
  describe("createLiquidityTransactionPayload", () => {
    const mockPublicKey = new PublicKey("11111111111111111111111111111112");
    const mockParams = {
      poolDetails: { tokenXMint: "tokenX123", tokenYMint: "tokenY456" },
      publicKey: mockPublicKey,
      slippage: "0.5",
      tokenAddresses: {
        tokenAAddress: "tokenA123",
        tokenBAddress: "tokenB456",
      },
      tokenAmounts: { tokenAAmount: "100", tokenBAmount: "200" },
    };
    it("should create valid transaction payload", () => {
      const result = createLiquidityTransactionPayload(mockParams);
      expect(result).toEqual({
        maxAmountX: 200,
        maxAmountY: 100,
        slippage: 0.5,
        tokenXMint: "tokenA123",
        tokenYMint: "tokenB456",
        user: mockPublicKey.toBase58(),
      });
    });
    it("should throw error for invalid token addresses", () => {
      vi.mocked(sortSolanaAddresses).mockReturnValueOnce({
        tokenXAddress: null,
        tokenYAddress: "tokenB456",
      });
      expect(() => createLiquidityTransactionPayload(mockParams)).toThrow(
        "Invalid token addresses after sorting",
      );
    });
    it("should handle different slippage values", () => {
      const paramsWithHighSlippage = {
        ...mockParams,
        slippage: "1.0",
      };
      const result = createLiquidityTransactionPayload(paramsWithHighSlippage);
      expect(result.slippage).toBe(1.0);
    });
  });
  describe("calculateTokenAmountByPrice", () => {
    it("should calculate correct amount with valid inputs", () => {
      const result = calculateTokenAmountByPrice("100", "1.5");
      expect(result).toBe("150");
    });
    it('should return "0" for zero input amount', () => {
      const result = calculateTokenAmountByPrice("0", "1.5");
      expect(result).toBe("0");
    });
    it('should return "0" for zero price', () => {
      const result = calculateTokenAmountByPrice("100", "0");
      expect(result).toBe("0");
    });
    it('should return "0" for negative values', () => {
      vi.mocked(parseAmountBigNumber).mockReturnValueOnce({
        gt: vi.fn(() => false),
        multipliedBy: vi.fn(),
      });
      const result = calculateTokenAmountByPrice("-100", "1.5");
      expect(result).toBe("0");
    });
  });
  describe("determineInputType", () => {
    const mockPoolDetails = {
      tokenXMint: "tokenX123",
      tokenYMint: "tokenY456",
    };
    it('should return "tokenX" when no pool details', () => {
      const result = determineInputType("buy", null, "tokenA", "tokenB");
      expect(result).toBe("tokenX");
    });
    it('should return "tokenX" for sell when tokenB matches tokenXMint', () => {
      const result = determineInputType(
        "sell",
        mockPoolDetails,
        "tokenA123",
        "tokenX123",
      );
      expect(result).toBe("tokenX");
    });
    it('should return "tokenX" for buy when tokenA matches tokenXMint', () => {
      const result = determineInputType(
        "buy",
        mockPoolDetails,
        "tokenX123",
        "tokenB456",
      );
      expect(result).toBe("tokenX");
    });
    it('should return "tokenY" for other cases', () => {
      const result = determineInputType(
        "sell",
        mockPoolDetails,
        "tokenA123",
        "tokenY456",
      );
      expect(result).toBe("tokenY");
    });
    it("should handle edge cases with missing token addresses", () => {
      const result = determineInputType(
        "buy",
        mockPoolDetails,
        null,
        "tokenB456",
      );
      expect(result).toBe("tokenY");
    });
  });
});
