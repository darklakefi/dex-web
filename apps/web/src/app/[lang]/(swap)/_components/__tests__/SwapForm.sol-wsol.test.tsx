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
import { vi } from "vitest";
import { ReferralCodeProvider } from "../../../../_components/ReferralCodeProvider";
import { SwapForm } from "../SwapForm";

// Mock dependencies
vi.mock("@solana/wallet-adapter-react");
vi.mock("@dex-web/orpc", () => ({
  client: {
    dexGateway: {
      createUnsignedTransaction: vi.fn(),
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
        queryOptions: vi.fn(() => ({
          queryFn: () => Promise.resolve([]),
          queryKey: ["token-accounts"],
        })),
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
      tokenAAddress: "So11111111111111111111111111111111111111111", // SOL
      tokenBAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    },
    vi.fn(),
  ],
}));

// Test constants
const SOL_ADDRESS = "So11111111111111111111111111111111111111111";
const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";
const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const MOCK_PUBLIC_KEY = new PublicKey("11111111111111111111111111111112");

// Mock wallet
const mockWallet = {
  connected: true,
  publicKey: MOCK_PUBLIC_KEY,
  signTransaction: vi.fn(),
  wallet: { adapter: { name: "mock" } },
};

// Mock client responses
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

describe.skip("SwapForm SOL/WSOL Gateway Address Tests", () => {
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

  describe("Gateway Address Handling - Acceptance Criteria", () => {
    it("should send SOL address to gateway when SOL is selected", async () => {
      // Mock SOL -> USDC swap
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

      // Simulate user entering amount and triggering swap
      const amountInput = screen.getByRole("textbox");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getByRole("button");
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: SOL_ADDRESS, // Should send SOL address
            tokenMintY: USDC_ADDRESS,
          }),
        );
      });
    });

    it("should send WSOL address to gateway when WSOL is selected", async () => {
      // Mock WSOL -> USDC swap
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

      // Simulate user entering amount and triggering swap
      const amountInput = screen.getByRole("textbox");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getByRole("button");
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: WSOL_ADDRESS, // Should send WSOL address
            tokenMintY: USDC_ADDRESS,
          }),
        );
      });
    });

    it("should handle SOL to WSOL swap correctly", async () => {
      // Mock SOL -> WSOL swap
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

      // Simulate user entering amount and triggering swap
      const amountInput = screen.getByRole("textbox");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getByRole("button");
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: SOL_ADDRESS, // Native SOL address
            tokenMintY: WSOL_ADDRESS, // WSOL address
          }),
        );
      });
    });

    it("should handle WSOL to SOL swap correctly", async () => {
      // Mock WSOL -> SOL swap
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

      // Simulate user entering amount and triggering swap
      const amountInput = screen.getByRole("textbox");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getByRole("button");
      fireEvent.click(swapButton);

      await waitFor(() => {
        expect(mockCreateUnsignedTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            tokenMintX: WSOL_ADDRESS, // WSOL address
            tokenMintY: SOL_ADDRESS, // Native SOL address
          }),
        );
      });
    });
  });

  describe("Gateway Call Parameters", () => {
    it("should include all required parameters in gateway call", async () => {
      render(
        <TestWrapper>
          <SwapForm />
        </TestWrapper>,
      );

      const amountInput = screen.getByRole("textbox");
      fireEvent.change(amountInput, { target: { value: "1" } });

      const swapButton = screen.getByRole("button");
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
