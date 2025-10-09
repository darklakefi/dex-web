/**
 * Unit tests for LP estimation helper functions
 *
 * These tests verify the pure helper functions extracted from useLPTokenEstimation:
 * - mapUIToProtocolOrder - UI to protocol token order mapping
 * - convertToAtomicAmounts - Display to atomic unit conversion
 * - shouldEnableQuery - Query enablement logic
 * - convertLPTokenResponse - Response data transformation
 */

import type { TokenOrderContext } from "@dex-web/utils";
import { describe, expect, it } from "vitest";
import {
  convertLPTokenResponse,
  convertToAtomicAmounts,
  mapUIToProtocolOrder,
  shouldEnableQuery,
} from "../lpEstimationHelpers";

const createMockOrderContext = (tokenAIsX: boolean): TokenOrderContext => ({
  mapping: {
    tokenAIsX,
  },
  protocol: {
    tokenX: "token-x-mint",
    tokenY: "token-y-mint",
  },
  ui: {
    tokenA: tokenAIsX ? "token-x-mint" : "token-y-mint",
    tokenB: tokenAIsX ? "token-y-mint" : "token-x-mint",
  },
});

describe("mapUIToProtocolOrder", () => {
  describe("when orderContext is null", () => {
    it("returns zeros for all values", () => {
      const result = mapUIToProtocolOrder(null, "100", "200", 9, 6);

      expect(result).toEqual({
        tokenXAmount: "0",
        tokenXDecimals: 0,
        tokenYAmount: "0",
        tokenYDecimals: 0,
      });
    });
  });

  describe("when tokenAIsX is true", () => {
    it("maps tokenA to tokenX and tokenB to tokenY", () => {
      const orderContext = createMockOrderContext(true);
      const result = mapUIToProtocolOrder(orderContext, "100", "200", 9, 6);

      expect(result).toEqual({
        tokenXAmount: "100",
        tokenXDecimals: 9,
        tokenYAmount: "200",
        tokenYDecimals: 6,
      });
    });

    it("preserves decimal amounts", () => {
      const orderContext = createMockOrderContext(true);
      const result = mapUIToProtocolOrder(
        orderContext,
        "0.123456",
        "789.012",
        18,
        9,
      );

      expect(result).toEqual({
        tokenXAmount: "0.123456",
        tokenXDecimals: 18,
        tokenYAmount: "789.012",
        tokenYDecimals: 9,
      });
    });

    it("handles empty strings", () => {
      const orderContext = createMockOrderContext(true);
      const result = mapUIToProtocolOrder(orderContext, "", "", 9, 6);

      expect(result).toEqual({
        tokenXAmount: "",
        tokenXDecimals: 9,
        tokenYAmount: "",
        tokenYDecimals: 6,
      });
    });
  });

  describe("when tokenAIsX is false", () => {
    it("maps tokenA to tokenY and tokenB to tokenX (reversed)", () => {
      const orderContext = createMockOrderContext(false);
      const result = mapUIToProtocolOrder(orderContext, "100", "200", 9, 6);

      expect(result).toEqual({
        tokenXAmount: "200",
        tokenXDecimals: 6,
        tokenYAmount: "100",
        tokenYDecimals: 9,
      });
    });

    it("correctly swaps decimals", () => {
      const orderContext = createMockOrderContext(false);
      const result = mapUIToProtocolOrder(orderContext, "42", "84", 2, 8);

      expect(result).toEqual({
        tokenXAmount: "84",
        tokenXDecimals: 8,
        tokenYAmount: "42",
        tokenYDecimals: 2,
      });
    });
  });

  describe("edge cases", () => {
    it("handles zero amounts", () => {
      const orderContext = createMockOrderContext(true);
      const result = mapUIToProtocolOrder(orderContext, "0", "0", 9, 6);

      expect(result).toEqual({
        tokenXAmount: "0",
        tokenXDecimals: 9,
        tokenYAmount: "0",
        tokenYDecimals: 6,
      });
    });

    it("handles very large numbers", () => {
      const orderContext = createMockOrderContext(true);
      const result = mapUIToProtocolOrder(
        orderContext,
        "999999999999.999999",
        "888888888888.888888",
        18,
        18,
      );

      expect(result).toEqual({
        tokenXAmount: "999999999999.999999",
        tokenXDecimals: 18,
        tokenYAmount: "888888888888.888888",
        tokenYDecimals: 18,
      });
    });

    it("handles zero decimals", () => {
      const orderContext = createMockOrderContext(true);
      const result = mapUIToProtocolOrder(orderContext, "100", "200", 0, 0);

      expect(result).toEqual({
        tokenXAmount: "100",
        tokenXDecimals: 0,
        tokenYAmount: "200",
        tokenYDecimals: 0,
      });
    });
  });
});

describe("convertToAtomicAmounts", () => {
  describe("valid conversions", () => {
    it("converts whole numbers to atomic units", () => {
      const result = convertToAtomicAmounts("100", "200", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(100_000_000_000n);
      expect(result.tokenYAtomicAmount).toBe(200_000_000n);
      expect(result.slippageAtomic).toBe(0n);
    });

    it("converts decimal numbers to atomic units", () => {
      const result = convertToAtomicAmounts("0.5", "1.25", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(500_000_000n);
      expect(result.tokenYAtomicAmount).toBe(1_250_000n);
    });

    it("handles very small amounts", () => {
      const result = convertToAtomicAmounts("0.000001", "0.000002", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(1_000n);
      expect(result.tokenYAtomicAmount).toBe(2n);
    });

    it("handles zero decimals", () => {
      const result = convertToAtomicAmounts("100", "200", 0, 0);

      expect(result.tokenXAtomicAmount).toBe(100n);
      expect(result.tokenYAtomicAmount).toBe(200n);
    });

    it("handles 18 decimals (common for ERC20-like tokens)", () => {
      const result = convertToAtomicAmounts("1", "2", 18, 18);

      expect(result.tokenXAtomicAmount).toBe(1_000_000_000_000_000_000n);
      expect(result.tokenYAtomicAmount).toBe(2_000_000_000_000_000_000n);
    });
  });

  describe("error handling", () => {
    it("returns zeros when tokenXAmount is empty string", () => {
      const result = convertToAtomicAmounts("", "200", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(0n);
      expect(result.tokenYAtomicAmount).toBe(200_000_000n);
    });

    it("returns zeros when tokenYAmount is empty string", () => {
      const result = convertToAtomicAmounts("100", "", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(100_000_000_000n);
      expect(result.tokenYAtomicAmount).toBe(0n);
    });

    it("returns zeros when amounts are '0'", () => {
      const result = convertToAtomicAmounts("0", "0", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(0n);
      expect(result.tokenYAtomicAmount).toBe(0n);
    });

    it("handles invalid number strings gracefully", () => {
      const result = convertToAtomicAmounts("abc", "def", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(0n);
      expect(result.tokenYAtomicAmount).toBe(0n);
      expect(result.slippageAtomic).toBe(0n);
    });
  });

  describe("precision edge cases", () => {
    it("handles amounts that would round to zero in atomic units", () => {
      const result = convertToAtomicAmounts("0.0000000001", "0.0000001", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(0n);
      expect(result.tokenYAtomicAmount).toBe(0n);
    });

    it("handles maximum safe integer boundaries", () => {
      const result = convertToAtomicAmounts("1000000", "2000000", 9, 6);

      expect(result.tokenXAtomicAmount).toBe(1_000_000_000_000_000n);
      expect(result.tokenYAtomicAmount).toBe(2_000_000_000_000n);
    });
  });
});

describe("shouldEnableQuery", () => {
  const orderContext = createMockOrderContext(true);

  describe("enabled flag checks", () => {
    it("returns false when enabled is false", () => {
      const result = shouldEnableQuery(
        false,
        orderContext,
        "100",
        "200",
        100_000_000_000n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });

    it("returns false when orderContext is null", () => {
      const result = shouldEnableQuery(
        true,
        null,
        "100",
        "200",
        100_000_000_000n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });
  });

  describe("amount validation", () => {
    it("returns true when all amounts are valid and positive", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "100",
        "200",
        100_000_000_000n,
        200_000_000n,
      );

      expect(result).toBe(true);
    });

    it("returns false when tokenXAmount is zero string", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "0",
        "200",
        0n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });

    it("returns false when tokenYAmount is zero string", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "100",
        "0",
        100_000_000_000n,
        0n,
      );

      expect(result).toBe(false);
    });

    it("returns false when both amounts are zero", () => {
      const result = shouldEnableQuery(true, orderContext, "0", "0", 0n, 0n);

      expect(result).toBe(false);
    });

    it("returns false when tokenXAmount is empty string", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "",
        "200",
        0n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });

    it("returns false when tokenYAmount is empty string", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "100",
        "",
        100_000_000_000n,
        0n,
      );

      expect(result).toBe(false);
    });

    it("returns false when tokenXAmount is NaN", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "abc",
        "200",
        0n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });

    it("returns false when tokenYAmount is NaN", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "100",
        "def",
        100_000_000_000n,
        0n,
      );

      expect(result).toBe(false);
    });
  });

  describe("atomic amount validation (critical for bug fix)", () => {
    it("returns false when tokenXAtomicAmount is 0n despite positive string amount", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "0.0000000001",
        "200",
        0n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });

    it("returns false when tokenYAtomicAmount is 0n despite positive string amount", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "100",
        "0.0000000001",
        100_000_000_000n,
        0n,
      );

      expect(result).toBe(false);
    });

    it("returns true only when both string amounts AND atomic amounts are positive", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "0.001",
        "0.002",
        1_000_000n,
        2_000n,
      );

      expect(result).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles very small but valid amounts", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "0.000001",
        "0.000002",
        1_000n,
        2n,
      );

      expect(result).toBe(true);
    });

    it("handles very large amounts", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "999999999",
        "888888888",
        999_999_999_000_000_000n,
        888_888_888_000_000n,
      );

      expect(result).toBe(true);
    });

    it("returns false when negative amounts are provided", () => {
      const result = shouldEnableQuery(
        true,
        orderContext,
        "-100",
        "200",
        100_000_000_000n,
        200_000_000n,
      );

      expect(result).toBe(false);
    });
  });
});

describe("convertLPTokenResponse", () => {
  describe("basic conversions", () => {
    it("converts atomic amount to display string with correct decimals", () => {
      const result = convertLPTokenResponse(1_000_000_000n, 9);

      expect(result.estimatedLPTokens).toBe("1");
      expect(result.lpTokenAmountRaw).toBe(1_000_000_000n);
      expect(result.lpTokenDecimals).toBe(9);
    });

    it("handles 6 decimals correctly", () => {
      const result = convertLPTokenResponse(1_500_000n, 6);

      expect(result.estimatedLPTokens).toBe("1.5");
      expect(result.lpTokenAmountRaw).toBe(1_500_000n);
      expect(result.lpTokenDecimals).toBe(6);
    });

    it("handles 18 decimals correctly", () => {
      const result = convertLPTokenResponse(2_000_000_000_000_000_000n, 18);

      expect(result.estimatedLPTokens).toBe("2");
      expect(result.lpTokenAmountRaw).toBe(2_000_000_000_000_000_000n);
      expect(result.lpTokenDecimals).toBe(18);
    });

    it("accepts bigint for lpTokenDecimals", () => {
      const result = convertLPTokenResponse(1_000_000_000n, 9n);

      expect(result.estimatedLPTokens).toBe("1");
      expect(result.lpTokenDecimals).toBe(9);
    });
  });

  describe("decimal precision", () => {
    it("handles fractional LP tokens", () => {
      const result = convertLPTokenResponse(123_456_789n, 9);

      expect(result.estimatedLPTokens).toBe("0.123456789");
    });

    it("handles very small amounts", () => {
      const result = convertLPTokenResponse(1n, 9);

      expect(result.estimatedLPTokens).toBe("0.000000001");
    });

    it("handles very large amounts", () => {
      const result = convertLPTokenResponse(1_234_567_890_000_000_000n, 9);

      expect(result.estimatedLPTokens).toBe("1234567890");
    });

    it("handles zero LP tokens", () => {
      const result = convertLPTokenResponse(0n, 9);

      expect(result.estimatedLPTokens).toBe("0");
      expect(result.lpTokenAmountRaw).toBe(0n);
    });
  });

  describe("edge cases", () => {
    it("handles zero decimals", () => {
      const result = convertLPTokenResponse(100n, 0);

      expect(result.estimatedLPTokens).toBe("100");
      expect(result.lpTokenDecimals).toBe(0);
    });

    it("preserves exact bigint value in lpTokenAmountRaw", () => {
      const largeAmount = 99_999_999_999_999_999n;
      const result = convertLPTokenResponse(largeAmount, 9);

      expect(result.lpTokenAmountRaw).toBe(largeAmount);
      expect(typeof result.lpTokenAmountRaw).toBe("bigint");
    });

    it("converts bigint decimals to number", () => {
      const result = convertLPTokenResponse(1_000_000n, 6n);

      expect(typeof result.lpTokenDecimals).toBe("number");
      expect(result.lpTokenDecimals).toBe(6);
    });
  });

  describe("JavaScript number precision", () => {
    it("handles amounts within safe integer range", () => {
      const result = convertLPTokenResponse(9_007_199_254_740_991n, 0);

      expect(result.estimatedLPTokens).toBe("9007199254740991");
    });

    it("maintains precision for typical DeFi amounts", () => {
      const result = convertLPTokenResponse(1_000_000_000_000_000n, 9);

      expect(result.estimatedLPTokens).toBe("1000000");
    });
  });
});

describe("integration: helpers working together", () => {
  it("full flow: map UI order, convert to atomic, check enabled, convert response", () => {
    const orderContext = createMockOrderContext(true);

    const mapped = mapUIToProtocolOrder(orderContext, "100", "200", 9, 6);
    expect(mapped.tokenXAmount).toBe("100");
    expect(mapped.tokenYAmount).toBe("200");

    const atomic = convertToAtomicAmounts(
      mapped.tokenXAmount,
      mapped.tokenYAmount,
      mapped.tokenXDecimals,
      mapped.tokenYDecimals,
    );
    expect(atomic.tokenXAtomicAmount).toBeGreaterThan(0n);
    expect(atomic.tokenYAtomicAmount).toBeGreaterThan(0n);

    const enabled = shouldEnableQuery(
      true,
      orderContext,
      mapped.tokenXAmount,
      mapped.tokenYAmount,
      atomic.tokenXAtomicAmount,
      atomic.tokenYAtomicAmount,
    );
    expect(enabled).toBe(true);

    const response = convertLPTokenResponse(1_000_000_000n, 9);
    expect(response.estimatedLPTokens).toBe("1");
  });

  it("flow with reversed order (tokenAIsX = false)", () => {
    const orderContext = createMockOrderContext(false);

    const mapped = mapUIToProtocolOrder(orderContext, "100", "200", 9, 6);

    expect(mapped.tokenXAmount).toBe("200");
    expect(mapped.tokenYAmount).toBe("100");

    const atomic = convertToAtomicAmounts(
      mapped.tokenXAmount,
      mapped.tokenYAmount,
      mapped.tokenXDecimals,
      mapped.tokenYDecimals,
    );

    const enabled = shouldEnableQuery(
      true,
      orderContext,
      mapped.tokenXAmount,
      mapped.tokenYAmount,
      atomic.tokenXAtomicAmount,
      atomic.tokenYAtomicAmount,
    );
    expect(enabled).toBe(true);
  });

  it("flow catches precision loss edge case", () => {
    const orderContext = createMockOrderContext(true);

    const mapped = mapUIToProtocolOrder(
      orderContext,
      "0.0000000001",
      "200",
      9,
      6,
    );

    const atomic = convertToAtomicAmounts(
      mapped.tokenXAmount,
      mapped.tokenYAmount,
      mapped.tokenXDecimals,
      mapped.tokenYDecimals,
    );

    const enabled = shouldEnableQuery(
      true,
      orderContext,
      mapped.tokenXAmount,
      mapped.tokenYAmount,
      atomic.tokenXAtomicAmount,
      atomic.tokenYAtomicAmount,
    );
    expect(enabled).toBe(false);
  });
});
