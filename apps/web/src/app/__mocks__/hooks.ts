import { vi } from "vitest";

export const mockUseOptimizedPoolData = vi.fn(() => ({
  error: null,
  isLoading: false,
  poolDetails: {
    getPoolDetails: vi.fn(() => ({
      poolAddress: "mock-pool-address",
      price: "1.5",
      tokenXMint: "mock-token-x",
      tokenYMint: "mock-token-y",
    })),
    poolAddress: "mock-pool-address",
    price: "1.5",
    tokenXMint: "mock-token-x",
    tokenYMint: "mock-token-y",
  },
}));

export const mockUseRealtimePoolData = vi.fn(() => ({
  error: null,
  isLoading: false,
  poolDetails: {
    poolAddress: "mock-pool-address",
    price: "1.5",
    tokenXMint: "mock-token-x",
    tokenYMint: "mock-token-y",
  },
}));

export const mockUseRealtimeTokenAccounts = vi.fn(() => ({
  buyTokenAccount: {
    address: "mock-buy-address",
    amount: 1000000000,
    decimals: 9,
    symbol: "SOL",
  },
  error: null,
  isLoading: false,
  sellTokenAccount: {
    address: "mock-sell-address",
    amount: 500000000,
    decimals: 6,
    symbol: "USDC",
  },
}));

export const mockUseAnalytics = vi.fn(() => ({
  identify: vi.fn(),
  page: vi.fn(),
  track: vi.fn(),
}));

export const mockUseFormatPrice = vi.fn(() => "$150.00");

export const mockUseSuspenseQuery = vi.fn(() => ({
  data: { price: 1.5 },
  error: null,
  isLoading: false,
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
    useQuery: vi.fn(() => ({
      data: { price: 1.5 },
      error: null,
      isLoading: false,
    })),
    useSuspenseQuery: mockUseSuspenseQuery,
  };
});
