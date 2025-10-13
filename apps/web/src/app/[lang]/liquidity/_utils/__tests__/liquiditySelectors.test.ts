/**
 * Unit tests for liquidity selector functions
 *
 * These tests verify the pure selector functions that derive view state:
 * - selectLiquidityViewState - determines when to show different UI elements
 * - createPoolUrl - generates URLs for navigation
 */

import { describe, expect, it } from "vitest";
import type {
  PoolDetails,
  UseRealtimeTokenAccountsReturn,
} from "../../_types/liquidity.types";
import { createPoolUrl, selectLiquidityViewState } from "../liquiditySelectors";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";

/**
 * Creates mock pool details for testing
 */
function createMockPoolDetails(overrides?: Partial<PoolDetails>): PoolDetails {
  return {
    fee: 0.003,
    poolAddress: "mockPoolAddress",
    price: "0.5",
    tokenXMint: USDC,
    tokenXReserve: 10000,
    tokenYMint: SOL,
    tokenYReserve: 5000,
    totalSupply: 7071,
    ...overrides,
  };
}

/**
 * Creates mock token accounts data
 */
function createMockTokenAccountsData(
  overrides?: Partial<UseRealtimeTokenAccountsReturn>,
): UseRealtimeTokenAccountsReturn {
  return {
    buyTokenAccount: undefined,
    isLoadingBuy: false,
    isLoadingSell: false,
    isLoadingTokenA: false,
    isLoadingTokenB: false,
    isRealtime: false,
    isRefreshingBuy: false,
    isRefreshingSell: false,
    isRefreshingTokenA: false,
    isRefreshingTokenB: false,
    refetchBuyTokenAccount: () => {},
    refetchSellTokenAccount: () => {},
    refetchTokenAAccount: () => {},
    refetchTokenBAccount: () => {},
    sellTokenAccount: undefined,

    tokenAAccount: undefined,
    tokenBAccount: undefined,
    ...overrides,
  };
}

describe("selectLiquidityViewState", () => {
  describe("shouldShowAddLiquidityDetails", () => {
    it("returns true when pool exists and both amounts are non-zero", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(true);
    });

    it("returns false when pool does not exist", () => {
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        null,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns false when tokenAAmount is zero", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "0",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns false when tokenBAmount is zero", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "0",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns false when tokenAAmount is empty string", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns false when tokenBAmount is empty string", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns false when both amounts are zero", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "0",
        "0",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns false when both amounts are empty strings", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "",
        "",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("returns true with decimal amounts", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "0.5",
        "0.25",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(true);
    });

    it("returns true with very small amounts", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "0.000001",
        "0.000001",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(true);
    });
  });

  describe("isInitialLoading", () => {
    it("returns true when tokenAAddress is null", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        null,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.isInitialLoading).toBe(true);
    });

    it("returns true when tokenBAddress is null", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        null,
        tokenAccountsData,
        false,
      );

      expect(result.isInitialLoading).toBe(true);
    });

    it("returns true when both token accounts are loading", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData({
        isLoadingBuy: true,
        isLoadingSell: true,
      });

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.isInitialLoading).toBe(true);
    });

    it("returns true when pool is loading", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        true,
      );

      expect(result.isInitialLoading).toBe(true);
    });

    it("returns false when only buy token is loading", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData({
        isLoadingBuy: true,
        isLoadingSell: false,
      });

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.isInitialLoading).toBe(false);
    });

    it("returns false when only sell token is loading", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData({
        isLoadingBuy: false,
        isLoadingSell: true,
      });

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.isInitialLoading).toBe(false);
    });

    it("returns false when everything is loaded", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.isInitialLoading).toBe(false);
    });

    it("returns true when multiple loading conditions are met", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData({
        isLoadingBuy: true,
        isLoadingSell: true,
      });

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        null,
        null,
        tokenAccountsData,
        true,
      );

      expect(result.isInitialLoading).toBe(true);
    });
  });

  describe("combined view state", () => {
    it("returns correct state for typical loading scenario", () => {
      const tokenAccountsData = createMockTokenAccountsData({
        isLoadingBuy: true,
        isLoadingSell: true,
      });

      const result = selectLiquidityViewState(
        null,
        "0",
        "0",
        USDC,
        SOL,
        tokenAccountsData,
        true,
      );

      expect(result).toEqual({
        isInitialLoading: true,
        shouldShowAddLiquidityDetails: false,
      });
    });

    it("returns correct state for fully loaded with amounts", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result).toEqual({
        isInitialLoading: false,
        shouldShowAddLiquidityDetails: true,
      });
    });

    it("returns correct state for loaded but no amounts", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        "0",
        "0",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result).toEqual({
        isInitialLoading: false,
        shouldShowAddLiquidityDetails: false,
      });
    });
  });

  describe("edge cases", () => {
    it("handles null pool details gracefully", () => {
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        null,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
      expect(result.isInitialLoading).toBe(false);
    });

    it("handles whitespace in amounts", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result = selectLiquidityViewState(
        poolDetails,
        " ",
        " ",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result.shouldShowAddLiquidityDetails).toBe(false);
    });

    it("is a pure function - same inputs produce same outputs", () => {
      const poolDetails = createMockPoolDetails();
      const tokenAccountsData = createMockTokenAccountsData();

      const result1 = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      const result2 = selectLiquidityViewState(
        poolDetails,
        "100",
        "50",
        USDC,
        SOL,
        tokenAccountsData,
        false,
      );

      expect(result1).toEqual(result2);
    });
  });
});

describe("createPoolUrl", () => {
  const mockSerializer = (path: string, params: Record<string, string>) => {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    return `${path}?${queryString}`;
  };

  it("creates URL with create pool type", () => {
    const result = createPoolUrl(mockSerializer, "create");

    expect(result).toBe("/liquidity?type=create");
  });

  it("creates URL with add liquidity type", () => {
    const result = createPoolUrl(mockSerializer, "add");

    expect(result).toBe("/liquidity?type=add");
  });

  it("handles different page types", () => {
    const types = ["create", "add", "manage", "remove"];

    types.forEach((type) => {
      const result = createPoolUrl(mockSerializer, type);
      expect(result).toContain(`type=${type}`);
    });
  });

  it("returns string starting with /", () => {
    const result = createPoolUrl(mockSerializer, "create");

    expect(result).toMatch(/^\//);
  });

  it("includes liquidity path", () => {
    const result = createPoolUrl(mockSerializer, "create");

    expect(result).toContain("liquidity");
  });

  it("is deterministic for same inputs", () => {
    const result1 = createPoolUrl(mockSerializer, "create");
    const result2 = createPoolUrl(mockSerializer, "create");

    expect(result1).toBe(result2);
  });

  it("produces different URLs for different types", () => {
    const result1 = createPoolUrl(mockSerializer, "create");
    const result2 = createPoolUrl(mockSerializer, "add");

    expect(result1).not.toBe(result2);
  });

  describe("serializer integration", () => {
    it("works with custom serializer", () => {
      const customSerializer = (
        path: string,
        params: Record<string, string>,
      ) => {
        return `${path}/${params.type}`;
      };

      const result = createPoolUrl(customSerializer, "create");

      expect(result).toBe("/liquidity/create");
    });

    it("passes correct parameters to serializer", () => {
      const spySerializer = vi.fn(mockSerializer);

      createPoolUrl(spySerializer, "test-type");

      expect(spySerializer).toHaveBeenCalledWith("liquidity", {
        type: "test-type",
      });
    });
  });
});
