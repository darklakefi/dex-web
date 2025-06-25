import type { Swap } from "@dex-web/orpc/schemas";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapDetails } from "../SwapDetails";

vi.mock("@dex-web/orpc", () => ({
  client: {
    getSwapDetails: vi.fn().mockResolvedValue({
      buyAmount: 100,
      buyBalance: 100,
      buyToken: {
        address: DEFAULT_BUY_TOKEN,
        symbol: "SOL",
        value: "1000",
      },
      estimatedFeesUsd: 100,
      exchangeRate: 0.00669,
      mevProtectionEnabled: true,
      priceImpactPercentage: 12,
      sellAmount: 100,
      sellBalance: 100,
      sellToken: {
        address: DEFAULT_SELL_TOKEN,
        symbol: "USDC",
        value: "1000",
      },
      slippageTolerancePercentage: 12,
      swapProgressStep: 1,
      swapStatus: "pending",
      swapType: "swap",
      updatedAt: new Date().toISOString(),
      userAddress: "0x123",
    } satisfies Swap),
    getTokenDetails: vi.fn().mockResolvedValue({
      address: DEFAULT_BUY_TOKEN,
      imageUrl: "https://example.com/image.png",
      name: "Solana",
      symbol: "SOL",
      value: "1000",
    }),
  },
}));

const queryClient = new QueryClient();
const onUrlUpdate = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NuqsTestingAdapter
    onUrlUpdate={onUrlUpdate}
    searchParams={{
      buyTokenAddress: DEFAULT_BUY_TOKEN,
      sellTokenAddress: DEFAULT_SELL_TOKEN,
    }}
  >
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </NuqsTestingAdapter>
);

describe("SwapDetails", () => {
  it("renders", async () => {
    render(<SwapDetails />, { wrapper });
    expect(await screen.findByText("Price")).toBeDefined();
    expect(await screen.findByText("Price Impact")).toBeDefined();
    expect(await screen.findByText("Max Slippage")).toBeDefined();
    expect(await screen.findByText("MEV Protection")).toBeDefined();
    expect(await screen.findByText("Est. Fees")).toBeDefined();
  });
});
