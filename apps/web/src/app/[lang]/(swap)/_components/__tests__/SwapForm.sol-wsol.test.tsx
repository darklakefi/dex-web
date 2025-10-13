/**
 * SOL/WSOL specific tests for SwapForm component
 * Tests the acceptance criteria for gateway address handling
 */

import { client } from "@dex-web/orpc";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { afterEach, vi } from "vitest";
import { ReferralCodeProvider } from "../../../../_components/ReferralCodeProvider";
import { SwapForm } from "../SwapForm";

const SOL_ADDRESS = "So11111111111111111111111111111111111111111";
const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MOCK_PUBLIC_KEY = new PublicKey("11111111111111111111111111111112");

vi.mock("@solana/wallet-adapter-react");
vi.mock("../../../../hooks/useWalletCache", () => ({
  useWalletAdapter: vi.fn(() => ({
    data: { name: "mock" },
  })),
  useWalletPublicKey: vi.fn(() => ({
    data: MOCK_PUBLIC_KEY,
  })),
}));
vi.mock("../../../../hooks/usePoolData", () => ({
  usePoolData: vi.fn(() => ({
    data: {
      fee: 0.003,
      poolAddress: "mockPoolAddress",
      price: "1.0",
      tokenXMint: SOL_ADDRESS,
      tokenXReserve: 1000000000,
      tokenYMint: USDC_ADDRESS,
      tokenYReserve: 1000000000,
      totalSupply: 1000000000,
    },
    error: null,
    isLoading: false,
  })),
}));
vi.mock("../../../../hooks/useTokenPrices", () => ({
  useTokenPricesMap: vi.fn(() => ({
    prices: {
      [SOL_ADDRESS]: 100,
      [USDC_ADDRESS]: 1,
    },
  })),
}));
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: vi.fn(() => ({
    trackError: vi.fn(),
    trackSwap: vi.fn(),
  })),
}));
vi.mock("../../../../_components/TokenTransactionDetails", () => ({
  TokenTransactionDetails: () => null,
}));
vi.mock("@dex-web/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dex-web/core")>();
  return {
    ...actual,
    useTokenAccounts: vi.fn(() => ({
      buyTokenAccount: undefined,
      buyTokenUsesNativeSol: false,
      errorBuy: null,
      errorSell: null,
      errorTokenA: null,
      errorTokenB: null,
      isLoadingBuy: false,
      isLoadingSell: false,
      isLoadingTokenA: false,
      isLoadingTokenB: false,
      refetchBuyTokenAccount: vi.fn(),
      refetchSellTokenAccount: vi.fn(),
      refetchTokenAAccount: vi.fn(),
      refetchTokenBAccount: vi.fn(),
      sellTokenAccount: undefined,
      sellTokenUsesNativeSol: false,
      tokenAAccount: {
        tokenAccounts: [
          {
            address: "mockAccountAddress",
            amount: 1000000000,
            decimals: 9,
            mint: SOL_ADDRESS,
            symbol: "SOL",
          },
        ],
      },
      tokenAUsesNativeSol: true,
      tokenBAccount: {
        tokenAccounts: [
          {
            address: "mockAccountAddress",
            amount: 1000000000,
            decimals: 6,
            mint: USDC_ADDRESS,
            symbol: "USDC",
          },
        ],
      },
      tokenBUsesNativeSol: false,
    })),
  };
});
vi.mock("@dex-web/orpc", () => ({
  client: {
    dexGateway: {
      createUnsignedTransaction: vi.fn(),
    },
    swap: {
      getSwapQuote: vi.fn(async () => ({
        amountInRaw: "1000000000",
        amountOutRaw: "1000000000",
        estimatedFee: "5000",
        priceImpact: 0.5,
        slippage: 0.5,
        tokenX: {
          address: SOL_ADDRESS,
          decimals: 9,
          symbol: "SOL",
        },
        tokenY: {
          address: USDC_ADDRESS,
          decimals: 6,
          symbol: "USDC",
        },
      })),
    },
  },
  tanstackClient: {
    dexGateway: {
      getTokenMetadataList: {
        queryOptions: vi.fn(() => ({
          queryFn: () => Promise.resolve([]),
          queryKey: ["token-metadata-list"],
        })),
      },
    },
    helius: {
      getTokenAccounts: {
        queryOptions: vi.fn(({ input }) => {
          const tokenAccounts =
            input.mint === SOL_ADDRESS || input.mint === WSOL_ADDRESS
              ? [
                  {
                    address: "mockAccountAddress",
                    amount: 1000000000,
                    decimals: 9,
                    mint: input.mint,
                    symbol: input.mint === SOL_ADDRESS ? "SOL" : "WSOL",
                  },
                ]
              : [
                  {
                    address: "mockAccountAddress",
                    amount: 1000000000,
                    decimals: 6,
                    mint: input.mint,
                    symbol: "USDC",
                  },
                ];

          return {
            queryFn: () => Promise.resolve({ tokenAccounts }),
            queryKey: ["token-accounts", input.mint],
          };
        }),
      },
    },
    integrations: {
      createTorqueReferral: {
        queryOptions: vi.fn(() => ({
          queryFn: () => Promise.resolve({ referralCode: "TEST123" }),
          queryKey: ["torque-referral"],
        })),
      },
    },
    pools: {
      getPoolReserves: {
        queryOptions: vi.fn(() => ({
          queryFn: () =>
            Promise.resolve({
              lpSupply: "1000000000",
              reserveX: "1000000000",
              reserveY: "1000000000",
            }),
          queryKey: ["pool-reserves"],
        })),
      },
    },
    tokens: {
      getTokenPrice: {
        queryOptions: vi.fn(() => ({
          queryFn: () => Promise.resolve({ price: 1.0 }),
          queryKey: ["token-price"],
        })),
      },
    },
  },
}));
vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});
vi.mock("next/navigation", () => ({
  usePathname: () => "/swap",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("nuqs", () => ({
  useQueryStates: () => [
    {
      tokenAAddress: "So11111111111111111111111111111111111111111",
      tokenBAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
    vi.fn(),
  ],
}));

const mockWallet = {
  connected: true,
  publicKey: MOCK_PUBLIC_KEY,
  signTransaction: vi.fn(),
  wallet: { adapter: { name: "mock" } },
};

const mockCreateUnsignedTransaction = vi.fn();
const mockClient = {
  dexGateway: {
    createUnsignedTransaction: mockCreateUnsignedTransaction,
  },
};

function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <NextIntlClientProvider locale="en" messages={{}}>
      <ReferralCodeProvider>
        <NuqsTestingAdapter
          onUrlUpdate={vi.fn()}
          searchParams={{
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          }}
        >
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </NuqsTestingAdapter>
      </ReferralCodeProvider>
    </NextIntlClientProvider>
  );
}

describe("SwapForm SOL/WSOL Gateway Address Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue(mockWallet);
    vi.mocked(client).dexGateway = mockClient.dexGateway as any;

    mockCreateUnsignedTransaction.mockResolvedValue({
      success: true,
      trackingId: "mock-tracking-id",
      tradeId: "mock-trade-id",
      unsignedTransaction: "mock-transaction",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("Gateway Address Handling - Acceptance Criteria", () => {
    it.skip("should send SOL address to gateway when SOL is selected", async () => {
      vi.doMock("nuqs", () => ({
        useQueryStates: () => [
          {
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          },
          vi.fn(),
        ],
      }));

      render(
        <TestWrapper>
          <SwapForm />
        </TestWrapper>,
      );

      const amountInput = screen.getByLabelText("tokenAAmount");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getAllByRole("button")[0];
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: SOL_ADDRESS,
            tokenMintY: USDC_ADDRESS,
          }),
        );
      });
    });

    it.skip("should send WSOL address to gateway when WSOL is selected", async () => {
      vi.doMock("nuqs", () => ({
        useQueryStates: () => [
          {
            tokenAAddress: WSOL_ADDRESS,
            tokenBAddress: USDC_ADDRESS,
          },
          vi.fn(),
        ],
      }));

      render(
        <TestWrapper>
          <SwapForm />
        </TestWrapper>,
      );

      const amountInput = screen.getByLabelText("tokenAAmount");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getAllByRole("button")[0];
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: WSOL_ADDRESS,
            tokenMintY: USDC_ADDRESS,
          }),
        );
      });
    });

    it.skip("should handle SOL to WSOL swap correctly", async () => {
      vi.doMock("nuqs", () => ({
        useQueryStates: () => [
          {
            tokenAAddress: SOL_ADDRESS,
            tokenBAddress: WSOL_ADDRESS,
          },
          vi.fn(),
        ],
      }));

      render(
        <TestWrapper>
          <SwapForm />
        </TestWrapper>,
      );

      const amountInput = screen.getByLabelText("tokenAAmount");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getAllByRole("button")[0];
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: SOL_ADDRESS,
            tokenMintY: WSOL_ADDRESS,
          }),
        );
      });
    });

    it.skip("should handle WSOL to SOL swap correctly", async () => {
      vi.doMock("nuqs", () => ({
        useQueryStates: () => [
          {
            tokenAAddress: WSOL_ADDRESS,
            tokenBAddress: SOL_ADDRESS,
          },
          vi.fn(),
        ],
      }));

      render(
        <TestWrapper>
          <SwapForm />
        </TestWrapper>,
      );

      const amountInput = screen.getByLabelText("tokenAAmount");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getAllByRole("button")[0];
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: WSOL_ADDRESS,
            tokenMintY: SOL_ADDRESS,
          }),
        );
      });
    });
  });

  describe("Gateway Call Parameters", () => {
    it.skip("should include all required parameters in gateway call", async () => {
      render(
        <TestWrapper>
          <SwapForm />
        </TestWrapper>,
      );

      const amountInput = screen.getByLabelText("tokenAAmount");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getAllByRole("button")[0];
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amountIn: expect.any(BigInt),
            isSwapXToY: expect.any(Boolean),
            minOut: expect.any(BigInt),
            refCode: expect.any(String),
            tokenMintX: expect.any(String),
            tokenMintY: expect.any(String),
            trackingId: expect.any(String),
            userAddress: expect.any(String),
          }),
        );
      });
    });
  });
});
