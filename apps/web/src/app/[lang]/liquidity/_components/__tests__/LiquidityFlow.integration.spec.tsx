import { mockOrpc } from "../../../(swap)/_components/__tests__/__mocks__/mockOrpc";

mockOrpc();

import { PublicKey } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";
import { LiquidityForm } from "../LiquidityForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/liquidity",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));
const mockSignTransaction = vi.fn();
const mockWallet = {
  connected: true,
  publicKey: new PublicKey("11111111111111111111111111111112"),
  signTransaction: mockSignTransaction,
  wallet: { adapter: { name: "Phantom" } },
};
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mockWallet,
}));
const mockAnalytics = {
  trackError: vi.fn(),
  trackLiquidity: vi.fn(),
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
  isRealtime: true,
  poolDetails: {
    poolAddress: "existing-pool-123",
    tokenXMint: DEFAULT_BUY_TOKEN,
    tokenYMint: DEFAULT_SELL_TOKEN,
  },
};
vi.mock("../../../../hooks/useRealtimePoolData", () => ({
  useRealtimePoolData: () => mockPoolData,
}));
const mockTokenAccounts = {
  buyTokenAccount: {
    tokenAccounts: [
      {
        address: "sol-account",
        amount: 1000000000,
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
      { address: "usdc-account", amount: 1000000, decimals: 6, symbol: "USDC" },
    ],
  },
};
vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
  useRealtimeTokenAccounts: () => mockTokenAccounts,
}));
vi.mock("../../../_components/SkeletonTokenInput", () => ({
  SkeletonTokenInput: () => (
    <div data-testid="skeleton-token-input">Loading...</div>
  ),
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
const mockAddLiquidity = vi.fn();
const mockCheckStatus = vi.fn();
const mockSubmitSignedTransaction = vi.fn();
vi.mock("@dex-web/orpc", () => ({
  client: {
    dexGateway: {
      addLiquidity: mockAddLiquidity,
      checkTradeStatus: mockCheckStatus,
      submitSignedTransaction: mockSubmitSignedTransaction,
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
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
const renderLiquidityForm = (
  searchParams = {
    tokenAAddress: DEFAULT_BUY_TOKEN,
    tokenBAddress: DEFAULT_SELL_TOKEN,
  },
) => {
  const queryClient = createQueryClient();
  const onUrlUpdate = vi.fn();
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
describe.skip("LiquidityFlow Integration Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockSignTransaction.mockResolvedValue({});
    mockAddLiquidity.mockResolvedValue({
      unsignedTransaction: "mock-unsigned-transaction",
    });
    mockCheckStatus.mockResolvedValue({
      status: 0,
      tradeId: "mock-trade-id",
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
      expect(mockAddLiquidity).toHaveBeenCalledWith(
        expect.objectContaining({
          amountLp: expect.any(BigInt),
          maxAmountX: expect.any(BigInt),
          maxAmountY: expect.any(BigInt),
          tokenMintX: expect.any(String),
          tokenMintY: expect.any(String),
          userAddress: mockWallet.publicKey.toBase58(),
        }),
      );
      expect(mockSignTransaction).toHaveBeenCalledWith(
        "mock-unsigned-transaction",
      );
      await waitFor(
        () => {
          expect(
            screen.getByText("Liquidity added successfully! 🎉"),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
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
        }),
      );
      await waitFor(() => {
        expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
          expect.objectContaining({
            event: "liquidity_signed",
          }),
        );
      });
      await waitFor(() => {
        expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
          expect.objectContaining({
            event: "liquidity_confirmed",
          }),
        );
      });
    });
  });
  describe("Error Handling Flow", () => {
    it("should handle transaction creation failure", async () => {
      mockAddLiquidity.mockRejectedValue(new Error("Network error"));
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
        }),
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
        expect(
          screen.getByText("Liquidity added successfully! 🎉"),
        ).toBeInTheDocument();
      });
    });
    it("should handle transaction status failure", async () => {
      mockCheckStatus.mockResolvedValue({
        status: 2,
        tradeId: "mock-trade-id",
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
        { timeout: 5000 },
      );
      expect(mockAnalytics.trackLiquidity).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "liquidity_failed",
        }),
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
      expect(mockAddLiquidity).toHaveBeenCalledWith(
        expect.objectContaining({
          amountLp: expect.any(BigInt),
          maxAmountX: expect.any(BigInt),
          maxAmountY: expect.any(BigInt),
        }),
      );
    });
  });
  describe("State Persistence Flow", () => {
    it("should maintain form state during error recovery", async () => {
      mockAddLiquidity.mockRejectedValue(new Error("Network error"));
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
      mockAddLiquidity.mockResolvedValue({
        unsignedTransaction: "mock-transaction",
      });
      const retryButton = screen.getByText("Retry");
      await user.click(retryButton);
      expect(mockAddLiquidity).toHaveBeenLastCalledWith(
        expect.objectContaining({
          maxAmountX: expect.any(BigInt),
          maxAmountY: expect.any(BigInt),
        }),
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
        expect(
          screen.getByText("Liquidity added successfully! 🎉"),
        ).toBeInTheDocument();
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
        { timeout: 1000 },
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
        { timeout: 1000 },
      );
    });
  });
});
