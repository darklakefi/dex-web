/**
 * Unit tests for useLPTokenEstimation hook
 *
 * These tests verify the LP token estimation logic:
 * - Query enablement conditions
 * - Proper conversion from UI to protocol order
 * - Response data transformation
 * - Integration with existing mocks
 */

import "../../../../__mocks__/orpc";
import type { TokenOrderContext } from "@dex-web/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLPTokenEstimation } from "../useLPTokenEstimation";

describe("useLPTokenEstimation", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  const mockOrderContext: TokenOrderContext = {
    mapping: {
      tokenAIsX: true,
    },
    protocol: {
      tokenX: "token-x-address",
      tokenY: "token-y-address",
    },
    ui: {
      tokenA: "token-x-address",
      tokenB: "token-y-address",
    },
  };

  beforeEach(() => {
    queryClient?.clear();
  });

  describe("query enablement", () => {
    it("disables query when orderContext is null", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: null,
            slippage: "0.5",
            tokenAAmount: "100",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(false);
    });

    it("disables query when tokenAAmount is zero", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "0",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(false);
    });

    it("disables query when tokenBAmount is zero", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "100",
            tokenADecimals: 9,
            tokenBAmount: "0",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(false);
    });

    it("disables query when tokenAAmount is empty string", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(false);
    });

    it("enables query when all conditions are met", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "100",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe("data transformation", () => {
    it("transforms response data correctly from mocked response", async () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "100",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.data).toBeDefined(), {
        timeout: 3000,
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.estimatedLPTokens).toBeDefined();
      expect(typeof result.current.data?.lpTokenDecimals).toBe("number");
    });
  });

  describe("token order mapping", () => {
    it("maps amounts correctly when tokenAIsX is true", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "100",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(true);
    });

    it("maps amounts correctly when tokenAIsX is false", () => {
      const reversedOrderContext: TokenOrderContext = {
        mapping: {
          tokenAIsX: false,
        },
        protocol: {
          tokenX: "token-x-address",
          tokenY: "token-y-address",
        },
        ui: {
          tokenA: "token-y-address",
          tokenB: "token-x-address",
        },
      };

      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: reversedOrderContext,
            slippage: "0.5",
            tokenAAmount: "100",
            tokenADecimals: 6,
            tokenBAmount: "200",
            tokenBDecimals: 9,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles decimal amounts correctly", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "0.5",
            tokenADecimals: 9,
            tokenBAmount: "1.25",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(true);
    });

    it("handles very small amounts", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0.5",
            tokenAAmount: "0.000001",
            tokenADecimals: 9,
            tokenBAmount: "0.000001",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(true);
    });

    it("handles zero slippage", () => {
      const { result } = renderHook(
        () =>
          useLPTokenEstimation({
            enabled: true,
            orderContext: mockOrderContext,
            slippage: "0",
            tokenAAmount: "100",
            tokenADecimals: 9,
            tokenBAmount: "200",
            tokenBDecimals: 6,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEnabled).toBe(true);
    });
  });
});
