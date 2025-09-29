import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/liquidity",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackLiquidity: vi.fn(),
    trackError: vi.fn(),
  }),
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
    pools: {
      getPoolDetails: Object.assign(
        vi.fn().mockResolvedValue({
          poolAddress: "mock-pool",
          tokenXMint: "tokenX",
          tokenYMint: "tokenY",
        }),
        {
          queryOptions: vi.fn().mockImplementation(() => ({
            queryFn: () =>
              Promise.resolve({
                poolAddress: "mock-pool",
                tokenXMint: "tokenX",
                tokenYMint: "tokenY",
              }),
            queryKey: ["getPoolDetails"],
          })),
        },
      ),
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
const mockWallet: {
  publicKey: PublicKey | null;
  wallet: { adapter: { name: string } } | null;
  signTransaction: ReturnType<typeof vi.fn>;
} = {
  publicKey: null,
  wallet: null,
  signTransaction: vi.fn(),
};
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mockWallet,
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
  SkeletonTokenInput: () => (
    <div data-testid="skeleton-token-input">Loading...</div>
  ),
}));
import { LiquidityForm } from "../LiquidityForm";
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
  },
) => {
  const queryClient = createQueryClient();
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
      <NuqsTestingAdapter onUrlUpdate={vi.fn()} searchParams={searchParams}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </NextIntlClientProvider>
  );
  return render(<LiquidityForm />, { wrapper });
};
describe.skip("LiquidityForm Basic Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockWallet.publicKey = null;
    mockWallet.wallet = null;
  });
  describe("Wallet Disconnected State", () => {
    it("should show Connect Wallet button when wallet is disconnected", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });
    it("should show amount inputs but disable submission", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      expect(amountInputs).toHaveLength(2);
      await user.type(amountInputs[0]!, "100");
      const connectButton = screen.getByText("Connect Wallet");
      expect(connectButton.closest("button")).not.toHaveAttribute("disabled");
    });
  });
  describe("Wallet Connected State", () => {
    beforeEach(() => {
      mockWallet.publicKey = new PublicKey("11111111111111111111111111111112");
      mockWallet.wallet = { adapter: { name: "Phantom" } };
    });
    it("should show Create Pool button when no pool exists", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Create Pool")).toBeInTheDocument();
    });
    it("should validate amount inputs", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0");
      expect(screen.getByText("Create Pool")).toBeInTheDocument();
    });
  });
  describe("Token Selection", () => {
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
  });
  describe("Form Validation", () => {
    beforeEach(() => {
      mockWallet.publicKey = new PublicKey("11111111111111111111111111111112");
      mockWallet.wallet = { adapter: { name: "Phantom" } };
    });
    it("should require both amounts for pool creation", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "100");
      expect(screen.getByText("Enter token amounts")).toBeInTheDocument();
      await user.type(amountInputs[1]!, "50");
      expect(screen.getByText("Create Pool")).toBeInTheDocument();
    });
    it("should handle zero amounts", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      const amountInputs = screen.getAllByRole("textbox");
      await user.type(amountInputs[0]!, "0");
      await user.type(amountInputs[1]!, "0");
      expect(screen.getByText("Enter token amounts")).toBeInTheDocument();
    });
  });
});
