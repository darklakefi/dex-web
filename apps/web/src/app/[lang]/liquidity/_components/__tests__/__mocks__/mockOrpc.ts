import { vi } from "vitest";

export const mockOrpc = () => {
  vi.mock("@dex-web/orpc", () => ({
    client: {
      liquidity: {
        checkLiquidityTransactionStatus: vi.fn().mockResolvedValue({
          error: null,
          status: "finalized",
        }),
        createLiquidityTransaction: vi.fn().mockResolvedValue({
          success: true,
          transaction: "mock-transaction",
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
    useLiquidityTracking: vi.fn().mockReturnValue({
      trackConfirmed: vi.fn(),
      trackError: vi.fn(),
      trackFailed: vi.fn(),
      trackInitiated: vi.fn(),
      trackSigned: vi.fn(),
    }),
    useTokenAccounts: vi.fn().mockReturnValue({
      buyTokenAccount: null,
      sellTokenAccount: null,
    }),
    useTransactionStatus: vi.fn().mockReturnValue({
      checkTransactionStatus: vi.fn(),
    }),
    useTransactionToasts: vi.fn().mockReturnValue({
      showErrorToast: vi.fn(),
      showStatusToast: vi.fn(),
      showStepToast: vi.fn(),
      showSuccessToast: vi.fn(),
    }),
  }));
};
