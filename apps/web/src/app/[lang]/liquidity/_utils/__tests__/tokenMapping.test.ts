import { describe, expect, it } from "vitest";
import {
  mapAmountsProtocolToUI,
  mapAmountsUIToProtocol,
  mapTokensUIToProtocol,
  type TokenPairUI,
} from "../tokenMapping";

describe("tokenMapping", () => {
  // Real token addresses from your system
  const DUX_ADDRESS = "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX";
  const DUKY_ADDRESS = "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY";

  describe("mapTokensUIToProtocol", () => {
    it("should correctly map tokens when tokenA sorts first", () => {
      const tokenPairUI: TokenPairUI = {
        tokenA: { address: DUX_ADDRESS, decimals: 6 },
        tokenB: { address: DUKY_ADDRESS, decimals: 9 },
      };

      const result = mapTokensUIToProtocol(tokenPairUI);

      // DUX sorts before DUKY, so tokenA is tokenX
      expect(result.tokenAIsX).toBe(true);
      expect(result.tokenX.address).toBe(DUX_ADDRESS);
      expect(result.tokenX.decimals).toBe(6);
      expect(result.tokenY.address).toBe(DUKY_ADDRESS);
      expect(result.tokenY.decimals).toBe(9);
    });

    it("should correctly map tokens when tokenB sorts first", () => {
      const tokenPairUI: TokenPairUI = {
        tokenA: { address: DUKY_ADDRESS, decimals: 9 },
        tokenB: { address: DUX_ADDRESS, decimals: 6 },
      };

      const result = mapTokensUIToProtocol(tokenPairUI);

      // DUX (tokenB) sorts before DUKY (tokenA), so tokenB is tokenX
      expect(result.tokenAIsX).toBe(false); // tokenA (DUKY) is NOT tokenX
      expect(result.tokenX.address).toBe(DUX_ADDRESS);
      expect(result.tokenX.decimals).toBe(6);
      expect(result.tokenY.address).toBe(DUKY_ADDRESS);
      expect(result.tokenY.decimals).toBe(9);
    });

    it("should preserve all token metadata", () => {
      const tokenPairUI: TokenPairUI = {
        tokenA: {
          address: DUX_ADDRESS,
          decimals: 6,
          name: "DuX",
          symbol: "DUX",
        },
        tokenB: {
          address: DUKY_ADDRESS,
          decimals: 9,
          name: "DukY",
          symbol: "DUKY",
        },
      };

      const result = mapTokensUIToProtocol(tokenPairUI);

      expect(result.tokenX.name).toBe("DuX");
      expect(result.tokenX.symbol).toBe("DUX");
      expect(result.tokenY.name).toBe("DukY");
      expect(result.tokenY.symbol).toBe("DUKY");
    });

    it("should be deterministic - same input always produces same output", () => {
      const tokenPairUI: TokenPairUI = {
        tokenA: { address: DUX_ADDRESS, decimals: 6 },
        tokenB: { address: DUKY_ADDRESS, decimals: 9 },
      };

      const result1 = mapTokensUIToProtocol(tokenPairUI);
      const result2 = mapTokensUIToProtocol(tokenPairUI);

      expect(result1).toEqual(result2);
    });
  });

  describe("mapAmountsUIToProtocol", () => {
    it("should map amounts correctly when tokenA is tokenX", () => {
      const amounts = { amountA: "10", amountB: "20" };
      const result = mapAmountsUIToProtocol(amounts, true);

      expect(result.amountX).toBe("10");
      expect(result.amountY).toBe("20");
    });

    it("should map amounts correctly when tokenB is tokenX", () => {
      const amounts = { amountA: "10", amountB: "20" };
      const result = mapAmountsUIToProtocol(amounts, false);

      expect(result.amountX).toBe("20");
      expect(result.amountY).toBe("10");
    });

    it("should handle large numbers as strings", () => {
      const amounts = {
        amountA: "62276892.328915",
        amountB: "274402.75434",
      };
      const result = mapAmountsUIToProtocol(amounts, true);

      expect(result.amountX).toBe("62276892.328915");
      expect(result.amountY).toBe("274402.75434");
    });
  });

  describe("mapAmountsProtocolToUI", () => {
    it("should map amounts correctly when tokenA is tokenX", () => {
      const amounts = { amountX: "10", amountY: "20" };
      const result = mapAmountsProtocolToUI(amounts, true);

      expect(result.amountA).toBe("10");
      expect(result.amountB).toBe("20");
    });

    it("should map amounts correctly when tokenB is tokenX", () => {
      const amounts = { amountX: "10", amountY: "20" };
      const result = mapAmountsProtocolToUI(amounts, false);

      expect(result.amountA).toBe("20");
      expect(result.amountB).toBe("10");
    });

    it("should be the inverse of mapAmountsUIToProtocol", () => {
      const originalAmounts = { amountA: "100", amountB: "200" };

      // Map UI → Protocol → UI
      const protocolAmounts = mapAmountsUIToProtocol(originalAmounts, true);
      const backToUI = mapAmountsProtocolToUI(protocolAmounts, true);

      expect(backToUI).toEqual(originalAmounts);
    });
  });

  describe("integration tests", () => {
    it("should handle the original bug scenario correctly", () => {
      // Original bug: UI showed DUKY/DUX but addresses were actually DUX/DUKY
      const tokenPairUI: TokenPairUI = {
        tokenA: { address: DUX_ADDRESS, decimals: 6 }, // Actually DuX
        tokenB: { address: DUKY_ADDRESS, decimals: 9 }, // Actually DukY
      };

      const protocolMapping = mapTokensUIToProtocol(tokenPairUI);

      // Verify correct mapping
      expect(protocolMapping.tokenX.decimals).toBe(6); // DuX
      expect(protocolMapping.tokenY.decimals).toBe(9); // DukY
      expect(protocolMapping.tokenAIsX).toBe(true);

      // Map amounts
      const amounts = { amountA: "10", amountB: "2269.54326" };
      const protocolAmounts = mapAmountsUIToProtocol(
        amounts,
        protocolMapping.tokenAIsX,
      );

      expect(protocolAmounts.amountX).toBe("10"); // DuX amount
      expect(protocolAmounts.amountY).toBe("2269.54326"); // DukY amount
    });

    it("should handle reversed UI order correctly", () => {
      // If UI shows tokens in opposite order
      const tokenPairUI: TokenPairUI = {
        tokenA: { address: DUKY_ADDRESS, decimals: 9 }, // DukY first in UI
        tokenB: { address: DUX_ADDRESS, decimals: 6 }, // DuX second in UI
      };

      const protocolMapping = mapTokensUIToProtocol(tokenPairUI);

      // Protocol order should still be DuX (X), DukY (Y)
      // DUX is tokenB, and it sorts first, so it's tokenX
      expect(protocolMapping.tokenX.address).toBe(DUX_ADDRESS);
      expect(protocolMapping.tokenX.decimals).toBe(6); // DuX
      expect(protocolMapping.tokenY.address).toBe(DUKY_ADDRESS);
      expect(protocolMapping.tokenY.decimals).toBe(9); // DukY
      expect(protocolMapping.tokenAIsX).toBe(false); // tokenA is DUKY, which is Y

      // Map amounts
      const amounts = { amountA: "2269.54326", amountB: "10" };
      const protocolAmounts = mapAmountsUIToProtocol(
        amounts,
        protocolMapping.tokenAIsX,
      );

      expect(protocolAmounts.amountX).toBe("10"); // DuX amount (from B)
      expect(protocolAmounts.amountY).toBe("2269.54326"); // DukY amount (from A)
    });
  });
});
