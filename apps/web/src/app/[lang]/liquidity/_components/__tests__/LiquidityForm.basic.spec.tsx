import { PublicKey } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";

vi.mock("next/navigation", () => ({
  usePathname: () => "/liquidity",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackError: vi.fn(),
    trackLiquidity: vi.fn(),
  }),
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
          error: null,
          isLoading: false,
          mutate: vi.fn(),
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
    tokens: {
      getTokenBalance: {
        queryOptions: vi.fn(() => ({
          queryFn: () =>
            Promise.resolve({
              balance: 0,
              decimals: 9,
              mint: "mock-token",
            }),
          queryKey: ["tokenBalance"],
          staleTime: 5000,
        })),
      },
      getTokenMetadata: {
        queryOptions: vi.fn(() => ({
          queryFn: () =>
            Promise.resolve({
              "mock-token": {
                imageUrl: "https://example.com/mock-token.png",
                name: "Mock Token",
                symbol: "MOCK",
              },
            }),
          queryKey: ["tokenMetadata", ["mock-token"]],
          staleTime: 5000,
        })),
      },
      getTokenPrice: {
        queryOptions: vi.fn(() => ({
          queryFn: () =>
            Promise.resolve({
              mint: "mock-token",
              price: 100,
              quoteCurrency: "USD",
            }),
          queryKey: ["tokenPrice"],
          staleTime: 5000,
        })),
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
const mockWallet: {
  publicKey: PublicKey | null;
  wallet: { adapter: { name: string } } | null;
  signTransaction: ReturnType<typeof vi.fn>;
} = {
  publicKey: null,
  signTransaction: vi.fn(),
  wallet: null,
};
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => mockWallet,
}));
vi.mock("../../../../hooks/useRealtimePoolData", () => ({
  useRealtimePoolData: () => ({
    isRealtime: false,
    poolDetails: null,
  }),
}));
vi.mock("../../../../hooks/useRealtimeTokenAccounts", () => ({
  useRealtimeTokenAccounts: () => ({
    buyTokenAccount: null,
    isLoadingBuy: false,
    isLoadingSell: false,
    isRealtime: false,
    isRefreshingBuy: false,
    isRefreshingSell: false,
    refetchBuyTokenAccount: vi.fn(),
    refetchSellTokenAccount: vi.fn(),
    sellTokenAccount: null,
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
      mutations: { retry: false },
      queries: { retry: false },
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
      <NuqsTestingAdapter onUrlUpdate={vi.fn()} searchParams={searchParams}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </NextIntlClientProvider>
  );
  return render(<LiquidityForm />, { wrapper });
};
describe("LiquidityForm Basic Tests", () => {
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
    it.skip("should show Create Pool button when no pool exists", async () => {
      renderWithWrapper();
      await waitFor(() => {
        expect(screen.queryByText("Initializing...")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Create Pool")).toBeInTheDocument();
    });
    it.skip("should validate amount inputs", async () => {
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
    it.skip("should handle same token selection", async () => {
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
    it.skip("should require both amounts for pool creation", async () => {
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
    it.skip("should handle zero amounts", async () => {
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
