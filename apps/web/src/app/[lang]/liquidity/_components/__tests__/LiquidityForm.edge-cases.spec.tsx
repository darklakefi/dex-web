import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import React from "react";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/liquidity",
  useSearchParams: () => new URLSearchParams(),
}));
const mockAnalytics = {
  trackLiquidity: vi.fn(),
  trackError: vi.fn(),
};
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => mockAnalytics,
}));
vi.mock("../../../_components/SkeletonTokenInput", () => ({
  SkeletonTokenInput: () => (
    <div data-testid="skeleton-token-input">Loading...</div>
  ),
}));
vi.mock("@dex-web/orpc", () => ({
  client: {
    liquidity: {
      createLiquidityTransaction: vi.fn().mockResolvedValue({
        success: true,
        transaction: "mock-transaction",
      }),
      checkLiquidityTransactionStatus: vi.fn().mockResolvedValue({
        status: "finalized",
        error: null,
      }),
      getAddLiquidityReview: vi.fn().mockResolvedValue({ tokenAmount: 50 }),
    },
    pools: {
      getPoolDetails: vi.fn().mockResolvedValue({
        poolAddress: "mock-pool",
        tokenXMint: "tokenX",
        tokenYMint: "tokenY",
      }),
    },
  },
  tanstackClient: {
    liquidity: {
      createLiquidityTransaction: {
        useMutation: vi.fn().mockReturnValue({
          mutate: vi.fn(),
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));
vi.mock("@dex-web/core", () => ({
  ERROR_MESSAGES: {
    MISSING_WALLET_INFO: "Wallet not connected",
    MISSING_WALLET: "No wallet available",
  },
  useLiquidityTracking: () => ({
    trackInitiated: vi.fn(),
    trackSigned: vi.fn(),
    trackConfirmed: vi.fn(),
    trackFailed: vi.fn(),
    trackError: vi.fn(),
  }),
  useTokenAccounts: () => ({
    buyTokenAccount: null,
    sellTokenAccount: null,
  }),
  useTransactionStatus: () => ({
    checkTransactionStatus: vi.fn(),
  }),
  useTransactionToasts: () => ({
    showErrorToast: vi.fn(),
    showSuccessToast: vi.fn(),
    showStepToast: vi.fn(),
    showStatusToast: vi.fn(),
  }),
}));
const createTestWrapper = (searchParams = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const mockMessages = {
    liquidity: {
      squadsX: {
        responseStatus: {
          failed: {
            description: "Failed description",
            title: "Failed title",
          },
          confirmed: {
            description: "Success description",
            title: "Success title",
          },
        },
      },
    },
  };
  return ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <NuqsTestingAdapter
        onUrlUpdate={vi.fn()}
        searchParams={{
          tokenAAddress: DEFAULT_BUY_TOKEN,
          tokenBAddress: DEFAULT_SELL_TOKEN,
          ...searchParams,
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </NextIntlClientProvider>
  );
};
import { LiquidityForm } from "../LiquidityForm";
import { client } from "@dex-web/orpc";
describe.skip("LiquidityForm Edge Cases", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });
  describe("Cross-Origin and Security", () => {
    it("should handle wallet connection failures gracefully", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: null,
          wallet: null,
          signTransaction: null,
          connecting: false,
          connected: false,
        }),
      }));
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });
    it("should sanitize input to prevent XSS attacks", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi.fn(),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "test-pool",
          },
          isRealtime: true,
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "<script>alert('xss')</script>");
      expect(amountInputs[0]).not.toHaveValue("<script>alert('xss')</script>");
    });
  });
  describe("Network Conditions", () => {
    it("should handle slow network connections with appropriate timeouts", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi
            .fn()
            .mockImplementation(
              () => new Promise((resolve) => setTimeout(resolve, 3000)),
            ),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "test-pool",
          },
          isRealtime: true,
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      vi.mocked(client.liquidity.createLiquidityTransaction).mockResolvedValue({
        success: true,
        transaction: "mock-transaction",
      });
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      expect(screen.getByText("Processing Transaction...")).toBeInTheDocument();
    });
    it("should handle concurrent requests appropriately", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi.fn().mockResolvedValue({}),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "test-pool",
          },
          isRealtime: true,
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      let callCount = 0;
      vi.mocked(client.liquidity.createLiquidityTransaction).mockImplementation(
        () => {
          callCount++;
          return Promise.resolve({
            success: true,
            transaction: `mock-transaction-${callCount}`,
          });
        },
      );
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      expect(client.liquidity.createLiquidityTransaction).toHaveBeenCalledTimes(
        1,
      );
    });
  });
  describe("Memory Management", () => {
    it("should cleanup subscriptions on unmount", () => {
      const { unmount } = render(<LiquidityForm />, {
        wrapper: createTestWrapper(),
      });
      const mockCleanup = vi.fn();
      vi.spyOn(React, "useEffect").mockImplementation((effect, _deps) => {
        const cleanup = effect();
        if (typeof cleanup === "function") {
          mockCleanup.mockImplementation(cleanup);
        }
        return cleanup;
      });
      unmount();
      expect(mockCleanup).toHaveBeenCalled();
    });
  });
  describe("Accessibility", () => {
    it("should maintain proper ARIA states during submission", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi
            .fn()
            .mockImplementation(
              () => new Promise((resolve) => setTimeout(resolve, 1000)),
            ),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "test-pool",
          },
          isRealtime: true,
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      expect(submitButton.closest("button")).toHaveAttribute("disabled");
      expect(submitButton.closest("button")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
    it("should provide appropriate screen reader announcements", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi.fn().mockResolvedValue({}),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 100, decimals: 9, symbol: "SOL" }],
          },
          sellTokenAccount: {
            tokenAccounts: [{ amount: 100, decimals: 6, symbol: "USDC" }],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "1000");
      await waitFor(() => {
        expect(screen.getByText(/Insufficient.*balance/)).toBeInTheDocument();
      });
      const errorMessage = screen.getByText(/Insufficient.*balance/);
      expect(errorMessage).toHaveAttribute("role", "alert");
    });
  });
  describe("Performance Edge Cases", () => {
    it("should handle rapid consecutive amount changes efficiently", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi.fn(),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "test-pool",
          },
          isRealtime: true,
        }),
      }));
      vi.mocked(client.liquidity.getAddLiquidityReview).mockResolvedValue({
        tokenAmount: 50,
        tokenAmountRaw: "50",
      });
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      for (let i = 1; i <= 10; i++) {
        await user.clear(amountInputs[0]!);
        await user.type(amountInputs[0]!, i.toString());
      }
      await waitFor(
        () => {
          expect(client.liquidity.getAddLiquidityReview).toHaveBeenCalledTimes(
            1,
          );
        },
        { timeout: 1000 },
      );
    });
    it("should handle very large numbers appropriately", async () => {
      vi.mock("@solana/wallet-adapter-react", () => ({
        useWallet: () => ({
          publicKey: new PublicKey("11111111111111111111111111111112"),
          wallet: { adapter: { name: "Phantom" } },
          signTransaction: vi.fn(),
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              {
                amount: Number.MAX_SAFE_INTEGER,
                decimals: 9,
                symbol: "SOL",
              },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              {
                amount: Number.MAX_SAFE_INTEGER,
                decimals: 6,
                symbol: "USDC",
              },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      render(<LiquidityForm />, { wrapper: createTestWrapper() });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "999999999999999999999");
      expect(amountInputs[0]).toHaveValue();
    });
  });
});
