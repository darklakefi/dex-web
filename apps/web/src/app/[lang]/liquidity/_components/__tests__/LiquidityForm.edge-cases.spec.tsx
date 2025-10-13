import { PublicKey } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/liquidity",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));
const mockAnalytics = {
  trackError: vi.fn(),
  trackLiquidity: vi.fn(),
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
    dexGateway: {
      addLiquidity: vi.fn().mockResolvedValue({
        unsignedTransaction: "mock-transaction-base64",
      }),
      checkTradeStatus: vi.fn().mockResolvedValue({
        status: 0,
        tradeId: "mock-trade-id",
      }),
      submitSignedTransaction: vi.fn().mockResolvedValue({
        errorLogs: [],
        success: true,
        tradeId: "mock-trade-id",
      }),
    },
    liquidity: {
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
          error: null,
          isLoading: false,
          mutate: vi.fn(),
        }),
      },
    },
  },
}));
vi.mock("@dex-web/core", () => ({
  ERROR_MESSAGES: {
    MISSING_WALLET: "No wallet available",
    MISSING_WALLET_INFO: "Wallet not connected",
  },
  useLiquidityTracking: () => ({
    trackConfirmed: vi.fn(),
    trackError: vi.fn(),
    trackFailed: vi.fn(),
    trackInitiated: vi.fn(),
    trackSigned: vi.fn(),
  }),
  useTokenAccounts: () => ({
    buyTokenAccount: null,
    sellTokenAccount: null,
    tokenAAccount: null,
    tokenBAccount: null,
  }),
  useTransactionStatus: () => ({
    checkTransactionStatus: vi.fn(),
  }),
  useTransactionToasts: () => ({
    showErrorToast: vi.fn(),
    showStatusToast: vi.fn(),
    showStepToast: vi.fn(),
    showSuccessToast: vi.fn(),
  }),
}));
const createTestWrapper = (searchParams = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const mockMessages = {
    liquidity: {
      squadsX: {
        responseStatus: {
          confirmed: {
            description: "Success description",
            title: "Success title",
          },
          failed: {
            description: "Failed description",
            title: "Failed title",
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

import { client } from "@dex-web/orpc";
import { LiquidityForm } from "../LiquidityForm";

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
          connected: false,
          connecting: false,
          publicKey: null,
          signTransaction: null,
          wallet: null,
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
          signTransaction: vi.fn(),
          wallet: { adapter: { name: "Phantom" } },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          isRealtime: true,
          poolDetails: {
            poolAddress: "test-pool",
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
          },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          isRealtime: true,
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
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
          signTransaction: vi
            .fn()
            .mockImplementation(
              () => new Promise((resolve) => setTimeout(resolve, 3000)),
            ),
          wallet: { adapter: { name: "Phantom" } },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          isRealtime: true,
          poolDetails: {
            poolAddress: "test-pool",
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
          },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          isRealtime: true,
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
        }),
      }));
      vi.mocked(client.dexGateway.addLiquidity).mockResolvedValue({
        unsignedTransaction: "mock-transaction-base64",
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
          signTransaction: vi.fn().mockResolvedValue({}),
          wallet: { adapter: { name: "Phantom" } },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          isRealtime: true,
          poolDetails: {
            poolAddress: "test-pool",
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
          },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          isRealtime: true,
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
        }),
      }));
      let callCount = 0;
      vi.mocked(client.dexGateway.addLiquidity).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          unsignedTransaction: `mock-transaction-${callCount}`,
        });
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
      await user.click(submitButton);
      await user.click(submitButton);
      expect(client.dexGateway.addLiquidity).toHaveBeenCalledTimes(1);
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
          signTransaction: vi
            .fn()
            .mockImplementation(
              () => new Promise((resolve) => setTimeout(resolve, 1000)),
            ),
          wallet: { adapter: { name: "Phantom" } },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          isRealtime: true,
          poolDetails: {
            poolAddress: "test-pool",
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
          },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 1000000000, decimals: 9, symbol: "SOL" }],
          },
          isRealtime: true,
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          sellTokenAccount: {
            tokenAccounts: [{ amount: 1000000, decimals: 6, symbol: "USDC" }],
          },
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
          signTransaction: vi.fn().mockResolvedValue({}),
          wallet: { adapter: { name: "Phantom" } },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [{ amount: 100, decimals: 9, symbol: "SOL" }],
          },
          isRealtime: true,
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          sellTokenAccount: {
            tokenAccounts: [{ amount: 100, decimals: 6, symbol: "USDC" }],
          },
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
          signTransaction: vi.fn(),
          wallet: { adapter: { name: "Phantom" } },
        }),
      }));
      vi.mock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          isRealtime: true,
          poolDetails: {
            poolAddress: "test-pool",
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
          },
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
          signTransaction: vi.fn(),
          wallet: { adapter: { name: "Phantom" } },
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
          isRealtime: true,
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          sellTokenAccount: {
            tokenAccounts: [
              {
                amount: Number.MAX_SAFE_INTEGER,
                decimals: 6,
                symbol: "USDC",
              },
            ],
          },
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
