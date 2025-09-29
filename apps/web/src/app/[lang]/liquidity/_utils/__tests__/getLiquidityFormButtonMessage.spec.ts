import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { getLiquidityFormButtonMessage } from "../getLiquidityFormButtonMessage";
const mockPublicKey = new PublicKey("11111111111111111111111111111112");
const defaultProps = {
  tokenAAmount: "0",
  tokenBAmount: "0",
  initialPrice: "1",
  liquidityStep: 0,
  poolDetails: null,
  tokenBAddress: "TokenB123",
  tokenAAddress: "TokenA123",
  buyTokenAccount: null,
  sellTokenAccount: null,
  publicKey: mockPublicKey,
};
const mockTokenAccount = {
  tokenAccounts: [
    {
      amount: 1000000000, 
      decimals: 9,
      symbol: "SOL",
    },
  ],
};
const mockUSDCAccount = {
  tokenAccounts: [
    {
      amount: 1000000, 
      decimals: 6,
      symbol: "USDC",
    },
  ],
};
const mockPoolDetails = {
  poolAddress: "pool123",
  tokenXMint: "TokenA123",
  tokenYMint: "TokenB123",
  price: "1.5",
};
describe("getLiquidityFormButtonMessage", () => {
  describe("Step-based messages", () => {
    it("should return step 1 message", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        liquidityStep: 1,
      });
      expect(result).toBe("protecting liquidity transaction [1/3]");
    });
    it("should return step 2 message", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        liquidityStep: 2,
      });
      expect(result).toBe("confirm liquidity in your wallet [2/3]");
    });
    it("should return step 3 message", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        liquidityStep: 3,
      });
      expect(result).toBe("verifying liquidity transaction [3/3]");
    });
    it("should return calculating message", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        liquidityStep: 10,
      });
      expect(result).toBe("calculating amounts...");
    });
  });
  describe("Token validation", () => {
    it("should return same tokens message when addresses match", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAddress: "SameToken123",
        tokenBAddress: "SameToken123",
      });
      expect(result).toBe("Select different tokens");
    });
  });
  describe("Balance validation", () => {
    it("should return insufficient balance for sell token", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenBAmount: "10", 
        sellTokenAccount: mockUSDCAccount, 
      });
      expect(result).toBe("Insufficient balance");
    });
    it("should return insufficient balance for buy token", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "10", 
        buyTokenAccount: mockTokenAccount, 
      });
      expect(result).toBe("Insufficient balance");
    });
    it("should pass balance validation with sufficient funds", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "0.5", 
        tokenBAmount: "0.5", 
        buyTokenAccount: mockTokenAccount, 
        sellTokenAccount: mockUSDCAccount, 
        poolDetails: mockPoolDetails,
      });
      expect(result).toBe("Add Liquidity");
    });
    it("should handle tokens with commas in amounts", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenBAmount: "1,000", 
        sellTokenAccount: mockUSDCAccount, 
      });
      expect(result).toBe("Insufficient balance");
    });
  });
  describe("Create Pool flow", () => {
    it("should return enter amounts when no pool and empty amounts", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: null,
        tokenAAmount: "0",
        tokenBAmount: "0",
      });
      expect(result).toBe("Enter token amounts");
    });
    it("should return enter amounts when no pool and one amount is zero", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: null,
        tokenAAmount: "100",
        tokenBAmount: "0",
      });
      expect(result).toBe("Enter token amounts");
    });
    it("should return invalid price when no pool and invalid initial price", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: null,
        tokenAAmount: "100",
        tokenBAmount: "50",
        initialPrice: "0",
      });
      expect(result).toBe("Invalid price");
    });
    it("should return invalid price when no pool and negative price", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: null,
        tokenAAmount: "100",
        tokenBAmount: "50",
        initialPrice: "-1",
      });
      expect(result).toBe("Invalid price");
    });
    it("should return create pool when valid amounts and price", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: null,
        tokenAAmount: "100",
        tokenBAmount: "50",
        initialPrice: "1.5",
      });
      expect(result).toBe("Create Pool");
    });
  });
  describe("Add Liquidity flow", () => {
    it("should return enter amount when pool exists but amounts are zero", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: mockPoolDetails,
        tokenAAmount: "0",
        tokenBAmount: "0",
      });
      expect(result).toBe("enter an amount");
    });
    it("should return enter amount when pool exists but one amount is zero", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: mockPoolDetails,
        tokenAAmount: "100",
        tokenBAmount: "0",
      });
      expect(result).toBe("enter an amount");
    });
    it("should return add liquidity when pool exists and valid amounts", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        poolDetails: mockPoolDetails,
        tokenAAmount: "100",
        tokenBAmount: "50",
      });
      expect(result).toBe("Add Liquidity");
    });
  });
  describe("Edge cases", () => {
    it("should handle missing token accounts gracefully", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "100",
        tokenBAmount: "50",
        poolDetails: mockPoolDetails,
        buyTokenAccount: null,
        sellTokenAccount: null,
      });
      expect(result).toBe("Add Liquidity");
    });
    it("should handle token accounts without tokenAccounts array", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "100",
        tokenBAmount: "50",
        poolDetails: mockPoolDetails,
        buyTokenAccount: { tokenAccounts: undefined },
        sellTokenAccount: { tokenAccounts: undefined },
      });
      expect(result).toBe("Add Liquidity");
    });
    it("should handle empty tokenAccounts array", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "100",
        tokenBAmount: "50",
        poolDetails: mockPoolDetails,
        buyTokenAccount: { tokenAccounts: [] },
        sellTokenAccount: { tokenAccounts: [] },
      });
      expect(result).toBe("Add Liquidity");
    });
    it("should handle very small amounts", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "0.000001",
        tokenBAmount: "0.000001",
        poolDetails: mockPoolDetails,
        buyTokenAccount: mockTokenAccount,
        sellTokenAccount: mockUSDCAccount,
      });
      expect(result).toBe("Add Liquidity");
    });
    it("should handle negative amounts by treating as zero", () => {
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "-100",
        tokenBAmount: "50",
        poolDetails: mockPoolDetails,
      });
      expect(result).toBe("enter an amount");
    });
    it("should handle missing or zero decimals", () => {
      const accountWithZeroDecimals = {
        tokenAccounts: [
          {
            amount: 1000,
            decimals: 0,
            symbol: "TOKEN",
          },
        ],
      };
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "1500", 
        buyTokenAccount: accountWithZeroDecimals,
        poolDetails: mockPoolDetails,
      });
      expect(result).toBe("Insufficient balance");
    });
    it("should handle missing amount in token account", () => {
      const accountWithoutAmount = {
        tokenAccounts: [
          {
            amount: undefined,
            decimals: 9,
            symbol: "TOKEN",
          },
        ],
      };
      const result = getLiquidityFormButtonMessage({
        ...defaultProps,
        tokenAAmount: "100",
        buyTokenAccount: accountWithoutAmount,
        poolDetails: mockPoolDetails,
      });
      expect(result).toBe("Insufficient balance");
    });
  });
});