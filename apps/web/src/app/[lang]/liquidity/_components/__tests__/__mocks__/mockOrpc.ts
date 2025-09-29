import { vi } from "vitest";

export const mockOrpc = () => {
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
    useLiquidityTracking: vi.fn().mockReturnValue({
      trackInitiated: vi.fn(),
      trackSigned: vi.fn(),
      trackConfirmed: vi.fn(),
      trackFailed: vi.fn(),
      trackError: vi.fn(),
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
      showSuccessToast: vi.fn(),
      showStepToast: vi.fn(),
      showStatusToast: vi.fn(),
    }),
  }));
};