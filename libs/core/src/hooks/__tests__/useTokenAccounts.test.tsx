import { PublicKey } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useTokenAccounts } from "../useTokenAccounts";

const mockTokenAccountsQueryClient = {
  helius: {
    getTokenAccounts: {
      queryOptions: vi.fn(() => ({
        queryFn: vi.fn(),
        queryKey: ["tokenAccounts", "mock"],
      })),
    },
  },
};

const SOL_ADDRESS = "So11111111111111111111111111111111111111111";
const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MOCK_PUBLIC_KEY = new PublicKey("11111111111111111111111111111112");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// TODO: Fix React 19 compatibility - these tests fail because @testing-library/react

describe.skip("useTokenAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SOL/WSOL Detection Logic", () => {
    it("should detect native SOL usage for SOL token", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(true);
      expect(result.current.sellTokenUsesNativeSol).toBe(false);
    });

    it("should not detect native SOL usage for WSOL token", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: WSOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(false);
      expect(result.current.sellTokenUsesNativeSol).toBe(false);
    });

    it("should handle SOL as sell token", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: USDC_ADDRESS,
            tokenBAddress: SOL_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(false);
      expect(result.current.sellTokenUsesNativeSol).toBe(true);
    });

    it("should handle WSOL as sell token", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: USDC_ADDRESS,
            tokenBAddress: WSOL_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(false);
      expect(result.current.sellTokenUsesNativeSol).toBe(false);
    });

    it("should handle both SOL and WSOL tokens", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: WSOL_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(true);
      expect(result.current.sellTokenUsesNativeSol).toBe(false);
    });

    it("should handle null token addresses", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: null,
            tokenBAddress: null,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(false);
      expect(result.current.sellTokenUsesNativeSol).toBe(false);
    });
  });

  describe("Acceptance Criteria Tests", () => {
    it("should indicate native SOL balance usage when SOL is selected", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(true);
    });

    it("should indicate token account balance usage when WSOL is selected", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: WSOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.buyTokenUsesNativeSol).toBe(false);
    });
  });

  describe("Return Value Structure", () => {
    it("should return all expected properties", () => {
      const { result } = renderHook(
        () =>
          useTokenAccounts({
            publicKey: MOCK_PUBLIC_KEY,
            tanstackClient: mockTokenAccountsQueryClient,
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: WSOL_ADDRESS,
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current).toHaveProperty("buyTokenAccount");
      expect(result.current).toHaveProperty("sellTokenAccount");
      expect(result.current).toHaveProperty("refetchBuyTokenAccount");
      expect(result.current).toHaveProperty("refetchSellTokenAccount");
      expect(result.current).toHaveProperty("isLoadingBuy");
      expect(result.current).toHaveProperty("isLoadingSell");
      expect(result.current).toHaveProperty("errorBuy");
      expect(result.current).toHaveProperty("errorSell");
      expect(result.current).toHaveProperty("buyTokenUsesNativeSol");
      expect(result.current).toHaveProperty("sellTokenUsesNativeSol");
    });
  });
});
