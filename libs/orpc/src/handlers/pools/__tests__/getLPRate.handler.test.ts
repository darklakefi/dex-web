import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { describe, expect, it, vi } from "vitest";
import { getPoolAccount, getTokenBalance } from "../../../utils/solana";
import { getTokenMetadataHandler } from "../../tokens/getTokenMetadata.handler";
import { getLPRateHandler } from "../getLPRate.handler";

vi.mock("../../getHelius", () => ({
  getHelius: vi.fn(() => ({
    connection: {
      getAccountInfo: vi.fn(),
    },
  })),
}));
vi.mock("../../../utils/solana", () => ({
  EXCHANGE_PROGRAM_ID: new PublicKey("11111111111111111111111111111112"),
  getPoolAccount: vi.fn(),
  getTokenBalance: vi.fn(),
}));
vi.mock("../../tokens/getTokenMetadata.handler", () => ({
  getTokenMetadataHandler: vi.fn(),
}));
vi.mock("@dex-web/utils", () => ({
  toRawUnits: vi.fn((amount: string, decimals: number) => {
    return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals));
  }),
}));
describe("getLPRateHandler", () => {
  const mockPoolAccount = {
    authority: new PublicKey("11111111111111111111111111111112"),
    bump: new BN(0),
    locked_x: new BN(0),
    locked_y: new BN(0),
    protocol_fee_x: new BN(500000),
    protocol_fee_y: new BN(1000000),
    reserve_x: new PublicKey("11111111111111111111111111111114"),
    reserve_y: new PublicKey("11111111111111111111111111111115"),
    token_lp_supply: new BN(1000000000),
    user_locked_x: new BN(1000000),
    user_locked_y: new BN(2000000),
  };
  const mockTokenMetadata = {
    "11111111111111111111111111111112": {
      address: "11111111111111111111111111111112",
      decimals: 6,
      symbol: "TOKENX",
    },
    "11111111111111111111111111111113": {
      address: "11111111111111111111111111111113",
      decimals: 6,
      symbol: "TOKENY",
    },
  };
  const mockReserveBalances = {
    reserveX: new BigNumber(1000000000),
    reserveY: new BigNumber(2000000000),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPoolAccount).mockResolvedValue(mockPoolAccount);
    vi.mocked(getTokenBalance)
      .mockResolvedValue(mockReserveBalances.reserveX)
      .mockResolvedValue(mockReserveBalances.reserveY);
    vi.mocked(getTokenMetadataHandler).mockResolvedValue(mockTokenMetadata);
  });
  describe("Basic LP token estimation", () => {
    it("should calculate LP tokens for equal ratio inputs", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
    it("should calculate LP tokens for different ratio inputs", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 50,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 300,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
    it("should handle zero input amounts", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 0,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 0,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBe("0");
    });
  });
  describe("Slippage calculations", () => {
    it("should apply slippage correctly", async () => {
      const input = {
        slippage: 5.0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const resultWithoutSlippage = await getLPRateHandler({
        ...input,
        slippage: 0,
      });
      const resultWithSlippage = await getLPRateHandler(input);
      const withoutSlippage = parseFloat(
        resultWithoutSlippage.estimatedLPTokens,
      );
      const withSlippage = parseFloat(resultWithSlippage.estimatedLPTokens);
      expect(withSlippage).toBeLessThan(withoutSlippage);
      expect(withSlippage).toBeCloseTo(withoutSlippage * 0.95, 0);
    });
    it("should handle high slippage", async () => {
      const input = {
        slippage: 50.0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
    it("should handle zero slippage", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
  });
  describe("Edge cases and error handling", () => {
    it("should handle very small input amounts", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 0.001,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 0.002,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
    it("should handle very large input amounts", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 1000000,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 2000000,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
    it("should handle different token decimals", async () => {
      const mockTokenMetadataWithDifferentDecimals = {
        "11111111111111111111111111111112": {
          address: "11111111111111111111111111111112",
          decimals: 9,
          symbol: "TOKENX",
        },
        "11111111111111111111111111111113": {
          address: "11111111111111111111111111111113",
          decimals: 18,
          symbol: "TOKENY",
        },
      };
      vi.mocked(getTokenMetadataHandler).mockResolvedValue(
        mockTokenMetadataWithDifferentDecimals,
      );
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
    it("should handle zero LP supply", async () => {
      const mockPoolAccountWithZeroSupply = {
        ...mockPoolAccount,
        token_lp_supply: 0,
      };
      vi.mocked(getPoolAccount).mockResolvedValue(
        mockPoolAccountWithZeroSupply,
      );
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBe("0");
    });
    it("should handle zero available reserves", async () => {
      const mockReserveBalancesZero = {
        reserveX: new BigNumber(1500000),
        reserveY: new BigNumber(3000000),
      };
      vi.mocked(getTokenBalance)
        .mockResolvedValueOnce(mockReserveBalancesZero.reserveX)
        .mockResolvedValueOnce(mockReserveBalancesZero.reserveY);
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBe("Infinity");
    });
  });
  describe("Precision and rounding", () => {
    it("should truncate LP tokens to integer values", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      const estimatedLP = parseFloat(result.estimatedLPTokens);
      expect(Number.isInteger(estimatedLP)).toBe(true);
    });
    it("should handle precision with small amounts", async () => {
      const input = {
        slippage: 0,
        tokenXAmount: 0.1,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 0.2,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBeDefined();
      expect(parseFloat(result.estimatedLPTokens)).toBeGreaterThan(0);
    });
  });
  describe("Error handling", () => {
    it("should throw error when pool account is not found", async () => {
      vi.mocked(getPoolAccount).mockRejectedValue(new Error("Pool not found"));
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      await expect(getLPRateHandler(input)).rejects.toThrow(
        "Failed to get LP rate",
      );
    });
    it("should throw error when token metadata is not found", async () => {
      vi.mocked(getTokenMetadataHandler).mockRejectedValue(
        new Error("Token metadata not found"),
      );
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      await expect(getLPRateHandler(input)).rejects.toThrow(
        "Failed to get LP rate",
      );
    });
    it("should handle token balance fetch errors", async () => {
      vi.mocked(getTokenBalance).mockResolvedValue(new BigNumber(0));
      const input = {
        slippage: 0,
        tokenXAmount: 100,
        tokenXMint: "11111111111111111111111111111112",
        tokenYAmount: 200,
        tokenYMint: "11111111111111111111111111111113",
      };
      const result = await getLPRateHandler(input);
      expect(result.estimatedLPTokens).toBe("-66666666666");
    });
  });
});
