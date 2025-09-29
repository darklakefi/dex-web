import { mockOrpc } from "../../../(swap)/_components/__tests__/__mocks__/mockOrpc";
mockOrpc();
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";
import { LiquidityForm } from "../LiquidityForm";
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/liquidity",
  useSearchParams: () => new URLSearchParams(),
}));
const mockSignTransaction = vi.fn();
const mockWallet = {
  publicKey: new PublicKey("11111111111111111111111111111112"),
  wallet: { adapter: { name: "Phantom" } },
  signTransaction: mockSignTransaction,
};
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mockWallet,
}));
const mockAnalytics = {
  trackLiquidity: vi.fn(),
  trackError: vi.fn(),
};
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => mockAnalytics,
}));
const mockPoolData: {
  poolDetails: {
    tokenXMint: string;
    tokenYMint: string;
    poolAddress: string;
  } | null;
  isRealtime: boolean;
} = {
  poolDetails: {
    tokenXMint: DEFAULT_BUY_TOKEN,
    tokenYMint: DEFAULT_SELL_TOKEN,
    poolAddress: "existing-pool-123",
  },
  isRealtime: true,
};
vi.mock("../../../../hooks/useRealtimePoolData", () => ({
  useRealtimePoolData: () => mockPoolData,
}));
const mockTokenAccounts = {
  buyTokenAccount: {
    tokenAccounts: [
      { amount: 1000000000, decimals: 9, symbol: "SOL", address: "sol-account" },
    ],
  },
  sellTokenAccount: {
    tokenAccounts: [
      { amount: 1000000, decimals: 6, symbol: "USDC", address: "usdc-account" },
    ],
  },
  refetchBuyTokenAccount: vi.fn(),
  refetchSellTokenAccount: vi.fn(),
  isRealtime: true,
};
vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
  useRealtimeTokenAccounts: () => mockTokenAccounts,
}));
vi.mock("../../../_components/SkeletonTokenInput", () => ({
  SkeletonTokenInput: () => <div data-testid="skeleton-token-input">Loading...</div>,
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
const mockCreateTransaction = vi.fn();
const mockCheckStatus = vi.fn();
vi.mock("@dex-web/orpc", () => ({
  client: {
    liquidity: {
      createLiquidityTransaction: mockCreateTransaction,
      checkLiquidityTransactionStatus: mockCheckStatus,
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
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
const renderLiquidityForm = (
  searchParams = {
    tokenAAddress: DEFAULT_BUY_TOKEN,
    tokenBAddress: DEFAULT_SELL_TOKEN,
  }
) => {
  const queryClient = createQueryClient();
  const onUrlUpdate = vi.fn();
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
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      <NuqsTestingAdapter onUrlUpdate={onUrlUpdate} searchParams={searchParams}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </NextIntlClientProvider>
  );
  return {
    ...render(<LiquidityForm />, { wrapper }),
    onUrlUpdate,
    queryClient,
  };
};
describe("LiquidityFlow Integration Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockSignTransaction.mockResolvedValue({});
    mockCreateTransaction.mockResolvedValue({
      success: true,
      transaction: "mock-unsigned-transaction",
    });
    mockCheckStatus.mockResolvedValue({
      status: "finalized",
      error: null,
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("Complete Success Flow", () => {
    it("should execute complete liquidity addition flow successfully", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      await waitFor(() => {
        const submitButton = screen.getByText("Add Liquidity");
        expect(submitButton.closest("button")).not.toHaveAttribute("disabled");
      });
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenXMint: expect.any(String),
          tokenYMint: expect.any(String),
          maxAmountX: expect.any(Number),
          maxAmountY: expect.any(Number),
          slippage: 0.5,
          user: mockWallet.publicKey.toBase58(),
        })
      );
      expect(mockSignTransaction).toHaveBeenCalledWith("mock-unsigned-transaction");
      await waitFor(
        () => {
          expect(screen.getByText("Liquidity added successfully! 🎉")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
      expect(mockTokenAccounts.refetchBuyTokenAccount).toHaveBeenCalled();
      expect(mockTokenAccounts.refetchSellTokenAccount).toHaveBeenCalled();
    });
    it("should track analytics events during successful flow", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "liquidity_initiated",
          properties: expect.objectContaining({
            action: "add",
            amountA: 0.1,
            amountB: 100,
            tokenA: DEFAULT_BUY_TOKEN,
            tokenB: DEFAULT_SELL_TOKEN,
          }),
        })
      );
      await waitFor(() => {
        expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
          expect.objectContaining({
            event: "liquidity_signed",
          })
        );
      });
      await waitFor(() => {
        expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
          expect.objectContaining({
            event: "liquidity_confirmed",
          })
        );
      });
    });
  });
  describe("Error Handling Flow", () => {
    it("should handle transaction creation failure", async () => {
      mockCreateTransaction.mockRejectedValue(new Error("Network error"));
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText("Retry")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
      });
      expect(mockAnalytics.trackError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: "liquidity",
          error: "Network error",
        })
      );
    });
    it("should handle signing failure and recover", async () => {
      mockSignTransaction.mockRejectedValue(new Error("User rejected"));
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
      const retryButton = screen.getByText("Retry");
      mockSignTransaction.mockResolvedValue({});
      await user.click(retryButton);
      await waitFor(() => {
        expect(screen.getByText("Liquidity added successfully! 🎉")).toBeInTheDocument();
      });
    });
    it("should handle transaction status failure", async () => {
      mockCheckStatus.mockResolvedValue({
        status: "failed",
        error: "Transaction failed on chain",
      });
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(
        () => {
          expect(screen.getByText(/Error:/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
      expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "liquidity_failed",
        })
      );
    });
  });
  describe("Real-time Updates", () => {
    it("should handle pool data updates during form interaction", async () => {
      const { rerender } = renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Add Liquidity")).toBeInTheDocument();
      mockPoolData.poolDetails = null;
      rerender(<LiquidityForm />);
      await waitFor(() => {
        expect(screen.getByText("Create Pool")).toBeInTheDocument();
      });
    });
    it("should handle token account balance updates", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "10");
      await waitFor(() => {
        expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
      });
      mockTokenAccounts.buyTokenAccount!.tokenAccounts[0]!.amount = 20000000000; 
      const submitButton = screen.queryByText("Add Liquidity");
      if (submitButton) {
        expect(submitButton.closest("button")).not.toHaveAttribute("disabled");
      }
    });
  });
  describe("Form Validation Flow", () => {
    it("should validate amounts in real-time", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0");
      expect(screen.getByText("enter an amount")).toBeInTheDocument();
      await user.clear(amountInputs[0]!);
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      await waitFor(() => {
        expect(screen.getByText("Add Liquidity")).toBeInTheDocument();
      });
    });
    it("should handle decimal precision correctly", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.123456789");
      await user.type(amountInputs[1]!, "123.456789");
      await waitFor(() => {
        expect(screen.getByText("Add Liquidity")).toBeInTheDocument();
      });
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          maxAmountX: expect.any(Number),
          maxAmountY: expect.any(Number),
        })
      );
    });
  });
  describe("State Persistence Flow", () => {
    it("should maintain form state during error recovery", async () => {
      mockCreateTransaction.mockRejectedValue(new Error("Network error"));
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.5");
      await user.type(amountInputs[1]!, "500");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
      expect(amountInputs[0]).toHaveValue("0.5");
      expect(amountInputs[1]).toHaveValue("500");
      mockCreateTransaction.mockResolvedValue({
        success: true,
        transaction: "mock-transaction",
      });
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);
      expect(mockCreateTransaction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          maxAmountX: 500,
          maxAmountY: 0.5,
        })
      );
    });
    it("should reset form state after successful transaction", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0.1");
      await user.type(amountInputs[1]!, "100");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText("Liquidity added successfully! 🎉")).toBeInTheDocument();
      });
      const addMoreButton = screen.getByText("Add More Liquidity");
      await user.click(addMoreButton);
      await waitFor(() => {
        expect(amountInputs[0]).toHaveValue("0");
        expect(amountInputs[1]).toHaveValue("0");
        expect(screen.getByText("enter an amount")).toBeInTheDocument();
      });
    });
  });
  describe("Auto-calculation Flow", () => {
    it("should auto-calculate paired amounts with debounce", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "100");
      await waitFor(
        () => {
          expect(amountInputs[1]).toHaveValue("50");
        },
        { timeout: 1000 }
      );
    });
    it("should handle rapid typing correctly", async () => {
      renderLiquidityForm();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "1");
      await user.type(amountInputs[0]!, "0");
      await user.type(amountInputs[0]!, "0");
      await waitFor(
        () => {
          expect(amountInputs[1]).toHaveValue("50");
        },
        { timeout: 1000 }
      );
    });
  });
});