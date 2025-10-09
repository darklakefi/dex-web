import { describe, expect, it } from "vitest";
import {
  calculateAvailableReserves,
  calculateLpTokensToReceive,
} from "../liquidityCalculations";

describe("liquidityCalculations", () => {
  describe("calculateAvailableReserves", () => {
    it("should calculate available reserves by subtracting fees and locked amounts", () => {
      const result = calculateAvailableReserves({
        protocolFeeX: 10n,
        protocolFeeY: 20n,
        reserveX: 1000n,
        reserveY: 2000n,
        userLockedX: 5n,
        userLockedY: 10n,
      });

      expect(result.availableReserveX).toBe(985n);
      expect(result.availableReserveY).toBe(1970n);
    });

    it("should handle zero fees and locked amounts", () => {
      const result = calculateAvailableReserves({
        protocolFeeX: 0n,
        protocolFeeY: 0n,
        reserveX: 1000n,
        reserveY: 2000n,
        userLockedX: 0n,
        userLockedY: 0n,
      });

      expect(result.availableReserveX).toBe(1000n);
      expect(result.availableReserveY).toBe(2000n);
    });

    it("should throw error if available reserves would be negative", () => {
      expect(() =>
        calculateAvailableReserves({
          protocolFeeX: 60n,
          protocolFeeY: 50n,
          reserveX: 100n,
          reserveY: 200n,
          userLockedX: 50n,
          userLockedY: 50n,
        }),
      ).toThrow("Available reserves cannot be negative");
    });

    it("should handle exactly zero available reserves", () => {
      const result = calculateAvailableReserves({
        protocolFeeX: 50n,
        protocolFeeY: 50n,
        reserveX: 100n,
        reserveY: 100n,
        userLockedX: 50n,
        userLockedY: 50n,
      });

      expect(result.availableReserveX).toBe(0n);
      expect(result.availableReserveY).toBe(0n);
    });
  });

  describe("calculateLpTokensToReceive", () => {
    describe("new pool (zero supply)", () => {
      it("should calculate sqrt(x * y) for initial liquidity", () => {
        const result = calculateLpTokensToReceive({
          amountX: 100n,
          amountY: 100n,
          availableReserveX: 0n,
          availableReserveY: 0n,
          totalLpSupply: 0n,
        });

        expect(result).toBe(100n);
      });

      it("should calculate sqrt for asymmetric amounts", () => {
        const result = calculateLpTokensToReceive({
          amountX: 100n,
          amountY: 400n,
          availableReserveX: 0n,
          availableReserveY: 0n,
          totalLpSupply: 0n,
        });

        expect(result).toBe(200n);
      });

      it("should handle large amounts for new pool", () => {
        const result = calculateLpTokensToReceive({
          amountX: 1000000000n,
          amountY: 1000000000n,
          availableReserveX: 0n,
          availableReserveY: 0n,
          totalLpSupply: 0n,
        });

        expect(result).toBe(1000000000n);
      });
    });

    describe("existing pool", () => {
      it("should calculate LP tokens based on pool ratio", () => {
        const result = calculateLpTokensToReceive({
          amountX: 100n,
          amountY: 200n,
          availableReserveX: 1000n,
          availableReserveY: 2000n,
          totalLpSupply: 1000n,
        });

        expect(result).toBe(100n);
      });

      it("should use minimum of lpFromX and lpFromY", () => {
        const result = calculateLpTokensToReceive({
          amountX: 100n,
          amountY: 150n,
          availableReserveX: 1000n,
          availableReserveY: 2000n,
          totalLpSupply: 1000n,
        });

        expect(result).toBe(75n);
      });

      it("should handle imbalanced deposits", () => {
        const result = calculateLpTokensToReceive({
          amountX: 200n,
          amountY: 100n,
          availableReserveX: 1000n,
          availableReserveY: 1000n,
          totalLpSupply: 2000n,
        });

        expect(result).toBe(200n);
      });

      it("should round down to ensure integer LP tokens", () => {
        const result = calculateLpTokensToReceive({
          amountX: 333n,
          amountY: 333n,
          availableReserveX: 1000n,
          availableReserveY: 1000n,
          totalLpSupply: 1000n,
        });

        expect(result).toBe(333n);
      });

      it("should handle large reserve pools", () => {
        const result = calculateLpTokensToReceive({
          amountX: 1000000000n,
          amountY: 2000000000n,
          availableReserveX: 10000000000n,
          availableReserveY: 20000000000n,
          totalLpSupply: 14142135623n,
        });

        expect(result).toBe(1414213562n);
      });
    });

    describe("edge cases", () => {
      it("should treat zero totalLpSupply as new pool", () => {
        const result = calculateLpTokensToReceive({
          amountX: 100n,
          amountY: 100n,
          availableReserveX: 1000n,
          availableReserveY: 2000n,
          totalLpSupply: 0n,
        });

        expect(result).toBe(100n);
      });

      it("should treat zero reserves as new pool", () => {
        const result = calculateLpTokensToReceive({
          amountX: 100n,
          amountY: 100n,
          availableReserveX: 0n,
          availableReserveY: 0n,
          totalLpSupply: 1000n,
        });

        expect(result).toBe(100n);
      });
    });
  });
});
