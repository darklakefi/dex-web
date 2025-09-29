import { vi } from "vitest";

export const mockUseOptimizedPoolData = vi.fn(() => ({
  poolDetails: {
    poolAddress: "mock-pool-address",
    tokenXMint: "mock-token-x",
    tokenYMint: "mock-token-y",
    price: "1.5",
    getPoolDetails: vi.fn(() => ({
      poolAddress: "mock-pool-address",
      tokenXMint: "mock-token-x",
      tokenYMint: "mock-token-y",
      price: "1.5",
    })),
  },
  isLoading: false,
  error: null,
}));

export const mockUseRealtimePoolData = vi.fn(() => ({
  poolDetails: {
    poolAddress: "mock-pool-address",
    tokenXMint: "mock-token-x",
    tokenYMint: "mock-token-y",
    price: "1.5",
  },
  isLoading: false,
  error: null,
}));

export const mockUseRealtimeTokenAccounts = vi.fn(() => ({
  buyTokenAccount: {
    address: "mock-buy-address",
    amount: 1000000000,
    decimals: 9,
    symbol: "SOL",
  },
  sellTokenAccount: {
    address: "mock-sell-address",
    amount: 500000000,
    decimals: 6,
    symbol: "USDC",
  },
  isLoading: false,
  error: null,
}));

export const mockUseAnalytics = vi.fn(() => ({
  track: vi.fn(),
  page: vi.fn(),
  identify: vi.fn(),
}));

export const mockUseFormatPrice = vi.fn(() => "$150.00");

export const mockUseSuspenseQuery = vi.fn(() => ({
  data: { price: 1.5 },
  isLoading: false,
  error: null,
}));

vi.mock("../../hooks/useOptimizedPoolData", () => ({
  useOptimizedPoolData: mockUseOptimizedPoolData,
}));

vi.mock("../../hooks/useRealtimePoolData", () => ({
  useRealtimePoolData: mockUseRealtimePoolData,
}));

vi.mock("../../hooks/useRealtimeTokenAccounts", () => ({
  useRealtimeTokenAccounts: mockUseRealtimeTokenAccounts,
}));

vi.mock("../../hooks/useAnalytics", () => ({
  useAnalytics: mockUseAnalytics,
}));

vi.mock("../_utils/useFormatPrice", () => ({
  useFormatPrice: mockUseFormatPrice,
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useSuspenseQuery: mockUseSuspenseQuery,
    useQuery: vi.fn(() => ({
      data: { price: 1.5 },
      isLoading: false,
      error: null,
    })),
  };
});
