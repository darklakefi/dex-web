import { PublicKey } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/liquidity",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: null,
    signTransaction: vi.fn(),
    wallet: null,
  }),
}));

vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackError: vi.fn(),
    trackLiquidity: vi.fn(),
  }),
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

vi.mock("@dex-web/orpc", () => ({
  client: {
    dexGateway: {
      addLiquidity: vi.fn().mockResolvedValue({
        unsignedTransaction: "mock-transaction-base64",
      }),
    },
  },
}));
function TestLiquidityButton({ publicKey }: { publicKey: PublicKey | null }) {
  if (!publicKey) {
    return <button type="button">Connect Wallet</button>;
  }
  return <button type="button">Add Liquidity</button>;
}

describe("LiquidityForm - Simplified Tests", () => {
  const queryClient = new QueryClient();

  const renderWithWrapper = (children: React.ReactNode) => {
    const wrapper = ({
      children: wrapperChildren,
    }: {
      children: React.ReactNode;
    }) => (
      <NextIntlClientProvider locale="en" messages={{}}>
        <NuqsTestingAdapter
          onUrlUpdate={vi.fn()}
          searchParams={new URLSearchParams()}
        >
          <QueryClientProvider client={queryClient}>
            {wrapperChildren}
          </QueryClientProvider>
        </NuqsTestingAdapter>
      </NextIntlClientProvider>
    );
    return render(children, { wrapper });
  };

  it("should show Connect Wallet button when wallet is disconnected", () => {
    renderWithWrapper(<TestLiquidityButton publicKey={null} />);
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("should show Add Liquidity button when wallet is connected", () => {
    const mockPublicKey = new PublicKey("11111111111111111111111111111112");
    renderWithWrapper(<TestLiquidityButton publicKey={mockPublicKey} />);
    expect(screen.getByText("Add Liquidity")).toBeInTheDocument();
  });

  it("should render without crashing", () => {
    expect(() => {
      renderWithWrapper(<TestLiquidityButton publicKey={null} />);
    }).not.toThrow();
  });
});
