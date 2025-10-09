/**
 * Tests for Token Order Management
 *
 * These tests verify the core token ordering logic that ensures correctness
 * throughout the liquidity flow. The functions tested here are pure and
 * deterministic, making them easy to test comprehensively.
 *
 * IMPORTANT: Solana uses buffer comparison (NOT lexicographic string sorting)
 * For our test tokens, the actual buffer comparison order is:
 *   SOL < USDT < USDC
 * This is different from string lexicographic order which would be:
 *   USDC < USDT < SOL (alphabetical by first char: E < E < S)
 */

import { describe, expect, it } from "vitest";
import {
  areTokenPairsEquivalent,
  createTokenOrderContext,
  getOrderMapping,
  mapAmountsToProtocol,
  mapAmountsToUI,
} from "../tokenOrder";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

describe("tokenOrder", () => {
  describe("createTokenOrderContext", () => {
    it("creates correct context when tokenA sorts first (A=X)", () => {
      const context = createTokenOrderContext(SOL, USDC);

      expect(context.ui.tokenA).toBe(SOL);
      expect(context.ui.tokenB).toBe(USDC);

      expect(context.protocol.tokenX).toBe(SOL);
      expect(context.protocol.tokenY).toBe(USDC);

      expect(context.mapping.tokenAIsX).toBe(true);
      expect(context.mapping.tokenBIsY).toBe(true);
    });

    it("creates correct context when tokenA sorts second (A=Y)", () => {
      const context = createTokenOrderContext(USDC, SOL);

      expect(context.ui.tokenA).toBe(USDC);
      expect(context.ui.tokenB).toBe(SOL);

      expect(context.protocol.tokenX).toBe(SOL);
      expect(context.protocol.tokenY).toBe(USDC);

      expect(context.mapping.tokenAIsX).toBe(false);
      expect(context.mapping.tokenBIsY).toBe(false);
    });

    it("is pure - same inputs produce same outputs", () => {
      const ctx1 = createTokenOrderContext(USDC, SOL);
      const ctx2 = createTokenOrderContext(USDC, SOL);

      expect(ctx1).toEqual(ctx2);
    });

    it("handles same token address twice", () => {
      const context = createTokenOrderContext(USDC, USDC);

      expect(context.ui.tokenA).toBe(USDC);
      expect(context.ui.tokenB).toBe(USDC);
      expect(context.protocol.tokenX).toBe(USDC);
      expect(context.protocol.tokenY).toBe(USDC);
      expect(context.mapping.tokenAIsX).toBe(true);
    });

    it("throws on invalid token address", () => {
      expect(() => createTokenOrderContext("invalid", SOL)).toThrow();
      expect(() => createTokenOrderContext(USDC, "invalid")).toThrow();
      expect(() => createTokenOrderContext("invalid", "invalid")).toThrow();
    });

    it("produces consistent results for all token orderings", () => {
      const tokens = [USDC, SOL, USDT];

      for (const tokenA of tokens) {
        for (const tokenB of tokens) {
          const context = createTokenOrderContext(tokenA, tokenB);

          expect(context.ui.tokenA).toBe(tokenA);
          expect(context.ui.tokenB).toBe(tokenB);

          if (context.mapping.tokenAIsX) {
            expect(context.ui.tokenA).toBe(context.protocol.tokenX);
            expect(context.ui.tokenB).toBe(context.protocol.tokenY);
          } else {
            expect(context.ui.tokenA).toBe(context.protocol.tokenY);
            expect(context.ui.tokenB).toBe(context.protocol.tokenX);
          }
        }
      }
    });
  });

  describe("mapAmountsToProtocol", () => {
    it("maps amounts correctly when A=X (no swap needed)", () => {
      const context = createTokenOrderContext(SOL, USDC);

      const uiAmounts = {
        amountA: "100",
        amountB: "200",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const protocolAmounts = mapAmountsToProtocol(uiAmounts, context);

      expect(protocolAmounts.tokenX).toBe(SOL);
      expect(protocolAmounts.tokenY).toBe(USDC);
      expect(protocolAmounts.amountX).toBe("100");
      expect(protocolAmounts.amountY).toBe("200");
    });

    it("maps amounts correctly when A=Y (swap needed)", () => {
      const context = createTokenOrderContext(USDC, SOL);

      const uiAmounts = {
        amountA: "200",
        amountB: "100",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const protocolAmounts = mapAmountsToProtocol(uiAmounts, context);

      expect(protocolAmounts.tokenX).toBe(SOL);
      expect(protocolAmounts.tokenY).toBe(USDC);
      expect(protocolAmounts.amountX).toBe("100");
      expect(protocolAmounts.amountY).toBe("200");
    });

    it("handles zero amounts", () => {
      const context = createTokenOrderContext(SOL, USDC);

      const uiAmounts = {
        amountA: "0",
        amountB: "0",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const protocolAmounts = mapAmountsToProtocol(uiAmounts, context);

      expect(protocolAmounts.amountX).toBe("0");
      expect(protocolAmounts.amountY).toBe("0");
    });

    it("handles decimal amounts", () => {
      const context = createTokenOrderContext(USDC, SOL);

      const uiAmounts = {
        amountA: "123.456789",
        amountB: "987.654321",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const protocolAmounts = mapAmountsToProtocol(uiAmounts, context);

      expect(protocolAmounts.amountX).toBe("987.654321");
      expect(protocolAmounts.amountY).toBe("123.456789");
    });

    it("is pure - same inputs produce same outputs", () => {
      const context = createTokenOrderContext(SOL, USDC);
      const uiAmounts = {
        amountA: "100",
        amountB: "200",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const result1 = mapAmountsToProtocol(uiAmounts, context);
      const result2 = mapAmountsToProtocol(uiAmounts, context);

      expect(result1).toEqual(result2);
    });
  });

  describe("mapAmountsToUI", () => {
    it("maps amounts correctly when X=A (no swap needed)", () => {
      const context = createTokenOrderContext(SOL, USDC);

      const protocolAmounts = {
        amountX: "100",
        amountY: "200",
        tokenX: context.protocol.tokenX,
        tokenY: context.protocol.tokenY,
      };

      const uiAmounts = mapAmountsToUI(protocolAmounts, context);

      expect(uiAmounts.tokenA).toBe(SOL);
      expect(uiAmounts.tokenB).toBe(USDC);
      expect(uiAmounts.amountA).toBe("100");
      expect(uiAmounts.amountB).toBe("200");
    });

    it("maps amounts correctly when X=B (swap needed)", () => {
      const context = createTokenOrderContext(USDC, SOL);

      const protocolAmounts = {
        amountX: "100",
        amountY: "200",
        tokenX: context.protocol.tokenX,
        tokenY: context.protocol.tokenY,
      };

      const uiAmounts = mapAmountsToUI(protocolAmounts, context);

      expect(uiAmounts.tokenA).toBe(USDC);
      expect(uiAmounts.tokenB).toBe(SOL);
      expect(uiAmounts.amountA).toBe("200");
      expect(uiAmounts.amountB).toBe("100");
    });

    it("is invertible with mapAmountsToProtocol (round trip)", () => {
      const context = createTokenOrderContext(USDC, SOL);

      const original = {
        amountA: "100",
        amountB: "200",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const protocol = mapAmountsToProtocol(original, context);
      const roundTrip = mapAmountsToUI(protocol, context);

      expect(roundTrip).toEqual(original);
    });

    it("handles decimal amounts", () => {
      const context = createTokenOrderContext(SOL, USDC);

      const protocolAmounts = {
        amountX: "0.000001",
        amountY: "999999.999999",
        tokenX: context.protocol.tokenX,
        tokenY: context.protocol.tokenY,
      };

      const uiAmounts = mapAmountsToUI(protocolAmounts, context);

      expect(uiAmounts.amountA).toBe("0.000001");
      expect(uiAmounts.amountB).toBe("999999.999999");
    });
  });

  describe("getOrderMapping", () => {
    it("extracts mapping from context", () => {
      const context = createTokenOrderContext(USDC, SOL);

      const mapping = getOrderMapping(context);

      expect(mapping.tokenAIsX).toBe(false);
      expect(mapping.tokenBIsY).toBe(false);
    });

    it("returns readonly mapping", () => {
      const context = createTokenOrderContext(SOL, USDC);
      const mapping = getOrderMapping(context);

      expect(mapping.tokenAIsX).toBeDefined();
      expect(mapping.tokenBIsY).toBeDefined();
      expect(typeof mapping.tokenAIsX).toBe("boolean");
      expect(typeof mapping.tokenBIsY).toBe("boolean");
    });
  });

  describe("areTokenPairsEquivalent", () => {
    it("returns true for same pool in different UI order", () => {
      const pair1 = { tokenA: USDC, tokenB: SOL };
      const pair2 = { tokenA: SOL, tokenB: USDC };

      expect(areTokenPairsEquivalent(pair1, pair2)).toBe(true);
    });

    it("returns true for UI and Protocol representations of same pool", () => {
      const uiPair = { tokenA: SOL, tokenB: USDC };
      const protocolPair = { tokenX: USDC, tokenY: SOL };

      expect(areTokenPairsEquivalent(uiPair, protocolPair)).toBe(true);
    });

    it("returns true for same pool in protocol order", () => {
      const pair1 = { tokenX: USDC, tokenY: SOL };
      const pair2 = { tokenX: USDC, tokenY: SOL };

      expect(areTokenPairsEquivalent(pair1, pair2)).toBe(true);
    });

    it("returns false for different pools", () => {
      const pair1 = { tokenA: USDC, tokenB: SOL };
      const pair2 = { tokenA: USDC, tokenB: USDT };

      expect(areTokenPairsEquivalent(pair1, pair2)).toBe(false);
    });

    it("returns false when only one token matches", () => {
      const pair1 = { tokenA: USDC, tokenB: SOL };
      const pair2 = { tokenA: USDT, tokenB: SOL };

      expect(areTokenPairsEquivalent(pair1, pair2)).toBe(false);
    });

    it("returns true when same token is selected twice", () => {
      const pair1 = { tokenA: USDC, tokenB: USDC };
      const pair2 = { tokenX: USDC, tokenY: USDC };

      expect(areTokenPairsEquivalent(pair1, pair2)).toBe(true);
    });
  });

  describe("integration - full flow", () => {
    it("maintains correctness through complete UI→Protocol→UI cycle", () => {
      const context = createTokenOrderContext(USDC, SOL);

      const userInput = {
        amountA: "5.5",
        amountB: "100",
        tokenA: context.ui.tokenA,
        tokenB: context.ui.tokenB,
      };

      const forProtocol = mapAmountsToProtocol(userInput, context);

      expect(forProtocol.tokenX).toBe(SOL);
      expect(forProtocol.tokenY).toBe(USDC);
      expect(forProtocol.amountX).toBe("100");
      expect(forProtocol.amountY).toBe("5.5");

      const forDisplay = mapAmountsToUI(forProtocol, context);

      expect(forDisplay.tokenA).toBe(USDC);
      expect(forDisplay.tokenB).toBe(SOL);
      expect(forDisplay.amountA).toBe("5.5");
      expect(forDisplay.amountB).toBe("100");

      expect(forDisplay).toEqual(userInput);
    });

    it("produces identical protocol payloads regardless of UI order", () => {
      const context1 = createTokenOrderContext(USDC, SOL);
      const amounts1 = {
        amountA: "100",
        amountB: "5.5",
        tokenA: context1.ui.tokenA,
        tokenB: context1.ui.tokenB,
      };
      const protocol1 = mapAmountsToProtocol(amounts1, context1);

      const context2 = createTokenOrderContext(SOL, USDC);
      const amounts2 = {
        amountA: "5.5",
        amountB: "100",
        tokenA: context2.ui.tokenA,
        tokenB: context2.ui.tokenB,
      };
      const protocol2 = mapAmountsToProtocol(amounts2, context2);

      expect(protocol1.tokenX).toBe(protocol2.tokenX);
      expect(protocol1.tokenY).toBe(protocol2.tokenY);
      expect(protocol1.amountX).toBe(protocol2.amountX);
      expect(protocol1.amountY).toBe(protocol2.amountY);
    });
  });
});
