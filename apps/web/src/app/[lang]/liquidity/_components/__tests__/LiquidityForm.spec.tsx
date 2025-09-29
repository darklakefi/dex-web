import { mockOrpc } from "../../../(swap)/_components/__tests__/__mocks__/mockOrpc";
mockOrpc();
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/liquidity",
  useSearchParams: () => new URLSearchParams(),
}));
interface MockWallet {
  publicKey: PublicKey | null;
  wallet: { adapter: { name: string } } | null;
  signTransaction: ReturnType<typeof vi.fn>;
}

const mockWallet: MockWallet = {
  publicKey: null,
  wallet: null,
  signTransaction: vi.fn(),
};

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mockWallet,
}));

vi.mock("../_hooks/useLiquidityCalculationWorker", () => ({
  useLiquidityCalculationWorker: () => ({
    isCalculating: false,
    calculateLiquidity: vi.fn(),
  }),
}));
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackLiquidity: vi.fn(),
    trackError: vi.fn(),
  }),
}));
vi.mock("../../../../hooks/useRealtimePoolData", () => ({
  useRealtimePoolData: () => ({
    poolDetails: null,
    isRealtime: false,
  }),
}));
vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
  useRealtimeTokenAccounts: () => ({
    buyTokenAccount: null,
    sellTokenAccount: null,
    refetchBuyTokenAccount: vi.fn(),
    refetchSellTokenAccount: vi.fn(),
    isLoadingBuy: false,
    isLoadingSell: false,
    isRefreshingBuy: false,
    isRefreshingSell: false,
    isRealtime: false,
  }),
}));
vi.mock("../../../_components/SkeletonTokenInput", () => ({
  SkeletonTokenInput: () => <div data-testid="skeleton-token-input">Loading...</div>,
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
      getAddLiquidityReview: vi.fn().mockResolvedValue({
        tokenAmount: 50,
      }),
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
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
const renderWithWrapper = (
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
const setWalletState = (wallet: typeof mockWallet) => {
  Object.assign(mockWallet, wallet);
};
describe.skip("LiquidityForm - Critical Path User Stories", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe("Story 1: Default state — wallet disconnected", () => {
    it("should render safely with no wallet and guide user to connect", async () => {
      // Ensure wallet is disconnected
      setWalletState({ publicKey: null, wallet: null, signTransaction: vi.fn() });
      
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      
      // Look for the Connect Wallet button
      const connectButton = screen.getByText("Connect Wallet");
      expect(connectButton).toBeInTheDocument();
      expect(connectButton.closest("button")).not.toHaveAttribute("disabled");
      
      // Check that amount inputs are present
      const amountInputs = screen.getAllByRole("textbox");
      expect(amountInputs).toHaveLength(2);
    });
    it("should not trigger submission when wallet disconnected", async () => {
      // Ensure wallet is disconnected
      setWalletState({ publicKey: null, wallet: null, signTransaction: vi.fn() });
      
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"100");
      fireEvent.keyDown(amountInputs[0]!, { key: "Enter" });
      expect(screen.queryByText("Processing Transaction...")).not.toBeInTheDocument();
    });
    it("should preserve disconnected state on refresh", async () => {
      // Ensure wallet is disconnected
      setWalletState({ publicKey: null, wallet: null, signTransaction: vi.fn() });
      
      const { rerender } = renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      rerender(<LiquidityForm />);
      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });
  });
  describe("Story 2: Connect wallet — empty inputs", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
    });
    it("should keep CTA disabled with empty inputs after connecting", async () => {
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "test-pool",
          },
          isRealtime: true,
        }),
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const submitButton = screen.queryByText("Add Liquidity");
      expect(submitButton?.closest("button")).toHaveAttribute("disabled");
    });
    it("should not fire create/submit calls automatically on connect", async () => {
      const createLiquidityTransaction = vi.fn();
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            createLiquidityTransaction,
            checkLiquidityTransactionStatus: vi.fn(),
          },
        },
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(createLiquidityTransaction).not.toHaveBeenCalled();
    });
  });
  describe("Story 3: Select tokens — query param sync", () => {
    it("should persist tokens via URL and rehydrate on reload", async () => {
      const customTokenA = "TokenA123456789";
      const customTokenB = "TokenB123456789";
      const { onUrlUpdate } = renderWithWrapper({
        tokenAAddress: customTokenA,
        tokenBAddress: customTokenB,
      });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.stringContaining(customTokenA)
      );
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.stringContaining(customTokenB)
      );
    });
    it("should handle invalid token addresses gracefully", async () => {
      const { container } = renderWithWrapper({
        tokenAAddress: "invalid-address",
        tokenBAddress: "another-invalid",
      });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(container).toBeInTheDocument();
      expect(screen.queryByText("Error")).not.toBeInTheDocument();
    });
  });
  describe("Story 4: Token order normalization", () => {
    it("should use consistent sorted order for pool requests", async () => {
      const mockPoolData = vi.fn();
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: mockPoolData.mockReturnValue({
          poolDetails: null,
          isRealtime: false,
        }),
      }));
      renderWithWrapper({
        tokenAAddress: "TokenZ",
        tokenBAddress: "TokenA",
      });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(mockPoolData).toHaveBeenCalledWith({
        tokenXMint: "TokenA",
        tokenYMint: "TokenZ",
      });
    });
  });
  describe("Story 5: Existing pool — interactive deposit", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
      vi.doMock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              { amount: 1000000000, decimals: 9, symbol: "SOL" },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              { amount: 1000000, decimals: 6, symbol: "USDC" },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
    });
    it("should enable deposit for existing pool with valid amounts", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0.1");
      await user.type(amountInputs[1]!,"0.1");
      await waitFor(() => {
        const button = screen.queryByText("Add Liquidity");
        expect(button?.closest("button")).not.toHaveAttribute("disabled");
      });
    });
    it("should not show Create Pool CTA for existing pool", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.queryByText("Create Pool")).not.toBeInTheDocument();
    });
  });
  describe("Story 6: Sufficient balance validation", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              { amount: 1000000000, decimals: 9, symbol: "SOL" },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              { amount: 1000000, decimals: 6, symbol: "USDC" },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
    });
    it("should show insufficient balance error when exceeding wallet balance", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"2000");
      await waitFor(() => {
        expect(screen.getByText(/Insufficient.*balance/)).toBeInTheDocument();
      });
      const submitButton = screen.queryByText("Add Liquidity");
      expect(submitButton?.closest("button")).toHaveAttribute("disabled");
    });
    it("should remove error when reducing amount below balance", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"2000");
      await waitFor(() => {
        expect(screen.getByText(/Insufficient.*balance/)).toBeInTheDocument();
      });
      await user.clear(amountInputs[0]!);
      await user.type(amountInputs[0]!,"0.1");
      await waitFor(() => {
        expect(screen.queryByText(/Insufficient.*balance/)).not.toBeInTheDocument();
      });
    });
  });
  describe("Story 7: Zero/empty amounts disable submission", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
    });
    it("should disable CTA with empty fields", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const submitButton = screen.queryByText("enter an amount");
      expect(submitButton?.closest("button")).toHaveAttribute("disabled");
    });
    it("should disable CTA with zero values", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0");
      await user.type(amountInputs[1]!,"0");
      const submitButton = screen.queryByText("enter an amount");
      expect(submitButton?.closest("button")).toHaveAttribute("disabled");
    });
    it("should sanitize whitespace to zero and block submission", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"   ");
      const submitButton = screen.queryByText("enter an amount");
      expect(submitButton?.closest("button")).toHaveAttribute("disabled");
    });
  });
  describe("Story 8: Auto-calc paired amount — existing pool", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
      const mockPreview = vi.fn().mockResolvedValue({ tokenAmount: 50 });
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            getAddLiquidityReview: mockPreview,
            createLiquidityTransaction: vi.fn(),
            checkLiquidityTransactionStatus: vi.fn(),
          },
        },
      }));
    });
    it("should auto-fill opposite field after debounce", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"100");
      await waitFor(
        () => {
          expect(amountInputs[1]).toHaveValue("50");
        },
        { timeout: 1000 }
      );
    });
  });
  describe("Story 9: Contextual CTA label", () => {
    it("should show 'Connect Wallet' when disconnected", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });
    it("should show 'Create Pool' when no pool exists", async () => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: null,
          isRealtime: true,
        }),
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Create Pool")).toBeInTheDocument();
    });
    it("should show 'Add Liquidity' with valid inputs and existing pool", async () => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
      vi.doMock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              { amount: 1000000000, decimals: 9, symbol: "SOL" },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              { amount: 1000000, decimals: 6, symbol: "USDC" },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0.1");
      await user.type(amountInputs[1]!,"0.1");
      await waitFor(() => {
        expect(screen.getByText("Add Liquidity")).toBeInTheDocument();
      });
    });
  });
  describe("Story 10: Successful transaction creation → signing", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn().mockResolvedValue({}),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
      vi.doMock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              { amount: 1000000000, decimals: 9, symbol: "SOL" },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              { amount: 1000000, decimals: 6, symbol: "USDC" },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
    });
    it("should call createLiquidityTransaction with correct payload", async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        success: true,
        transaction: "mock-transaction",
      });
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            createLiquidityTransaction: mockCreate,
            checkLiquidityTransactionStatus: vi.fn(),
          },
        },
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0.1");
      await user.type(amountInputs[1]!,"0.1");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenXMint: expect.any(String),
            tokenYMint: expect.any(String),
            maxAmountX: expect.any(Number),
            maxAmountY: expect.any(Number),
            slippage: 0.5,
            user: expect.any(String),
          })
        );
      });
    });
  });
  describe("Story 11: Status polling — success path", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn().mockResolvedValue({}),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
      vi.doMock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              { amount: 1000000000, decimals: 9, symbol: "SOL" },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              { amount: 1000000, decimals: 6, symbol: "USDC" },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
    });
    it("should show success state after transaction finalization", async () => {
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            createLiquidityTransaction: vi.fn().mockResolvedValue({
              success: true,
              transaction: "mock-transaction",
            }),
            checkLiquidityTransactionStatus: vi
              .fn()
              .mockResolvedValue({ status: "finalized", error: null }),
          },
        },
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0.1");
      await user.type(amountInputs[1]!,"0.1");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(
        () => {
          expect(
            screen.getByText("Liquidity added successfully! 🎉")
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
  describe("Story 12: Status polling — failure/timeout paths", () => {
    beforeEach(() => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn().mockResolvedValue({}),
      });
      vi.doMock("../../../../hooks/useRealtimePoolData", () => ({
        useRealtimePoolData: () => ({
          poolDetails: {
            tokenXMint: DEFAULT_BUY_TOKEN,
            tokenYMint: DEFAULT_SELL_TOKEN,
            poolAddress: "existing-pool-123",
          },
          isRealtime: true,
        }),
      }));
      vi.doMock("../../../../hooks/useRealtimeTokenAccounts", () => ({
        useRealtimeTokenAccounts: () => ({
          buyTokenAccount: {
            tokenAccounts: [
              { amount: 1000000000, decimals: 9, symbol: "SOL" },
            ],
          },
          sellTokenAccount: {
            tokenAccounts: [
              { amount: 1000000, decimals: 6, symbol: "USDC" },
            ],
          },
          refetchBuyTokenAccount: vi.fn(),
          refetchSellTokenAccount: vi.fn(),
          isRealtime: true,
        }),
      }));
    });
    it("should show error state on transaction failure", async () => {
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            createLiquidityTransaction: vi.fn().mockResolvedValue({
              success: true,
              transaction: "mock-transaction",
            }),
            checkLiquidityTransactionStatus: vi
              .fn()
              .mockResolvedValue({ status: "failed", error: "Transaction failed" }),
          },
        },
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0.1");
      await user.type(amountInputs[1]!,"0.1");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(
        () => {
          expect(screen.getByText(/Error:/)).toBeInTheDocument();
          expect(screen.getByText("Retry")).toBeInTheDocument();
          expect(screen.getByText("Reset")).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
    it("should reset to actionable state after error", async () => {
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            createLiquidityTransaction: vi.fn().mockRejectedValue(new Error("Network error")),
            checkLiquidityTransactionStatus: vi.fn(),
          },
        },
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!,"0.1");
      await user.type(amountInputs[1]!,"0.1");
      const submitButton = screen.getByText("Add Liquidity");
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText("Reset")).toBeInTheDocument();
      });
      const resetButton = screen.getByText("Reset");
      await user.click(resetButton);
      await waitFor(() => {
        expect(screen.getByText("Add Liquidity")).toBeInTheDocument();
        expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
      });
    });
  });
  describe("Additional Edge Cases", () => {
    it("should handle same token selection", async () => {
      renderWithWrapper({
        tokenAAddress: DEFAULT_BUY_TOKEN,
        tokenBAddress: DEFAULT_BUY_TOKEN,
      });
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Select different tokens")).toBeInTheDocument();
    });
    it("should handle network errors gracefully", async () => {
      setWalletState({
        publicKey: new PublicKey("11111111111111111111111111111112"),
        wallet: { adapter: { name: "Phantom" } },
        signTransaction: vi.fn(),
      });
      vi.doMock("@dex-web/orpc", () => ({
        client: {
          liquidity: {
            createLiquidityTransaction: vi.fn().mockRejectedValue(new Error("Network error")),
            checkLiquidityTransactionStatus: vi.fn(),
          },
        },
      }));
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const createPoolButton = screen.getByText("Create Pool");
      await user.click(createPoolButton);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("liquidity")
      );
    });
  });
});