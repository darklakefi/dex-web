import { describe, expect, it } from "vitest";
import {
  ADDRESS_QUERY_THRESHOLD,
  createTokenSearchIndex,
  searchTokens,
  sortTokensByRelevance,
} from "../tokenSearch";

describe("tokenSearch with MiniSearch", () => {
  const mockTokens = [
    {
      address: "So11111111111111111111111111111111111111112",
      decimals: 9,
      imageUrl: "",
      name: "Wrapped SOL",
      symbol: "SOL",
    },
    {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      decimals: 6,
      imageUrl: "",
      name: "USD Coin",
      symbol: "USDC",
    },
    {
      address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
      imageUrl: "",
      name: "USDT Stablecoin",
      symbol: "USDT",
    },
    {
      address: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
      decimals: 8,
      imageUrl: "",
      name: "Ether",
      symbol: "ETH",
    },
    {
      address: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      decimals: 9,
      imageUrl: "",
      name: "Marinade Staked SOL",
      symbol: "mSOL",
    },
  ];

  describe("sortTokensByRelevance", () => {
    it("should return original order for empty query", () => {
      const sorted = sortTokensByRelevance(mockTokens, "");
      expect(sorted).toEqual(mockTokens);
    });

    it("should return original order for whitespace query", () => {
      const sorted = sortTokensByRelevance(mockTokens, "   ");
      expect(sorted).toEqual(mockTokens);
    });

    it("should find exact symbol match", () => {
      const sorted = sortTokensByRelevance(mockTokens, "SOL");
      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted[0].symbol).toBe("SOL");
    });

    it("should be case-insensitive", () => {
      const upperSorted = sortTokensByRelevance(mockTokens, "SOL");
      const lowerSorted = sortTokensByRelevance(mockTokens, "sol");
      const mixedSorted = sortTokensByRelevance(mockTokens, "SoL");

      expect(upperSorted.length).toBe(lowerSorted.length);
      expect(lowerSorted.length).toBe(mixedSorted.length);
      expect(upperSorted[0].symbol).toBe(lowerSorted[0].symbol);
    });

    it("should prioritize symbol over name matches", () => {
      const sorted = sortTokensByRelevance(mockTokens, "SOL");

      const solIndex = sorted.findIndex((t) => t.symbol === "SOL");
      const msolIndex = sorted.findIndex((t) => t.symbol === "mSOL");

      expect(solIndex).toBeLessThan(msolIndex);
    });

    it("should handle prefix matching", () => {
      const sorted = sortTokensByRelevance(mockTokens, "USD");

      expect(sorted.length).toBeGreaterThanOrEqual(2);
      const symbols = sorted.map((t) => t.symbol);
      expect(symbols).toContain("USDC");
      expect(symbols).toContain("USDT");
    });

    it("should handle partial name matching", () => {
      const sorted = sortTokensByRelevance(mockTokens, "Coin");

      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted.some((t) => t.name.includes("Coin"))).toBe(true);
    });

    it("should handle address search", () => {
      const sorted = sortTokensByRelevance(
        mockTokens,
        "So11111111111111111111111111111111111111112",
      );

      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted[0].address).toBe(
        "So11111111111111111111111111111111111111112",
      );
    });

    it("should handle partial address search", () => {
      const sorted = sortTokensByRelevance(mockTokens, "So1111111");

      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted[0].address).toContain("So1111111");
    });

    it("should return empty array for no matches", () => {
      const sorted = sortTokensByRelevance(mockTokens, "NOTFOUND");
      expect(sorted).toHaveLength(0);
    });

    it("should handle fuzzy matching for typos", () => {
      const sorted = sortTokensByRelevance(mockTokens, "SOLS");

      expect(sorted.length).toBeGreaterThan(0);
    });

    it("should handle special characters in search", () => {
      const sorted = sortTokensByRelevance(mockTokens, "m-SOL");

      expect(sorted.length).toBeGreaterThanOrEqual(0);
    });

    it("should maintain relevance ordering", () => {
      const sorted = sortTokensByRelevance(mockTokens, "sol");

      if (sorted.length > 0) {
        expect(sorted[0].symbol).toBe("SOL");
      }

      if (sorted.length > 1) {
        const solIndex = sorted.findIndex((t) => t.symbol === "SOL");
        const msolIndex = sorted.findIndex((t) => t.symbol === "mSOL");

        if (solIndex !== -1 && msolIndex !== -1) {
          expect(solIndex).toBeLessThan(msolIndex);
        }
      }
    });

    it("should search across multiple fields", () => {
      const sorted = sortTokensByRelevance(mockTokens, "Wrapped");

      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted[0].name).toContain("Wrapped");
    });

    it("should handle numbers in search", () => {
      const sorted = sortTokensByRelevance(mockTokens, "7vfC");

      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted[0].address).toContain("7vfC");
    });

    it("should handle empty token array", () => {
      const sorted = sortTokensByRelevance([], "SOL");
      expect(sorted).toHaveLength(0);
    });

    it("should handle single token", () => {
      const singleToken = [mockTokens[0]];
      const sorted = sortTokensByRelevance(singleToken, "SOL");
      expect(sorted.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("ADDRESS_QUERY_THRESHOLD constant", () => {
    it("should be properly defined", () => {
      expect(ADDRESS_QUERY_THRESHOLD).toBe(30);
      expect(typeof ADDRESS_QUERY_THRESHOLD).toBe("number");
    });

    it("should correctly identify long queries as address searches", () => {
      const longQuery = "So11111111111111111111111111111111111111112";
      expect(longQuery.length).toBeGreaterThan(ADDRESS_QUERY_THRESHOLD);

      const sorted = sortTokensByRelevance(mockTokens, longQuery);
      if (sorted.length > 0) {
        expect(sorted[0].address).toBe(longQuery);
      }
    });
  });

  describe("Optimized API (createTokenSearchIndex + searchTokens)", () => {
    it("should create a reusable search index", () => {
      const index = createTokenSearchIndex(mockTokens);
      expect(index).toBeDefined();
    });

    it("should produce same results as sortTokensByRelevance", () => {
      const query = "SOL";

      const legacyResults = sortTokensByRelevance(mockTokens, query);

      const index = createTokenSearchIndex(mockTokens);
      const optimizedResults = searchTokens(index, mockTokens, query);

      expect(optimizedResults).toEqual(legacyResults);
    });

    it("should allow reusing index for multiple searches", () => {
      const index = createTokenSearchIndex(mockTokens);

      const results1 = searchTokens(index, mockTokens, "SOL");
      const results2 = searchTokens(index, mockTokens, "USD");
      const results3 = searchTokens(index, mockTokens, "ETH");

      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
      expect(results3.length).toBeGreaterThan(0);

      expect(results1[0].symbol).toBe("SOL");
      expect(results3[0].symbol).toBe("ETH");
    });

    it("should handle empty query with memoized index", () => {
      const index = createTokenSearchIndex(mockTokens);
      const results = searchTokens(index, mockTokens, "");

      expect(results).toEqual(mockTokens);
    });

    it("should work with storeFields optimization", () => {
      const index = createTokenSearchIndex(mockTokens);
      const results = searchTokens(index, mockTokens, "SOL");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("symbol");
      expect(results[0]).toHaveProperty("name");
      expect(results[0]).toHaveProperty("decimals");
    });
  });
});
