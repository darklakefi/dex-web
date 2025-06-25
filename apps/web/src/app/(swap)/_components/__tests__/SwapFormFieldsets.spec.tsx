import type { Swap } from "@dex-web/orpc/schemas/swaps";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapFormFieldsets } from "../SwapFormFieldsets";

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

vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));

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

describe("SwapFormFieldsets", () => {
  it("renders both buy and sell sections", async () => {
    render(<SwapFormFieldsets />, { wrapper });
    expect(await screen.findByText("Buying")).toBeDefined();
    expect(await screen.findByText("Selling")).toBeDefined();
    expect(await screen.findAllByLabelText(/Amount/)).toHaveLength(2);
    expect(await screen.findAllByText("100")).toHaveLength(2);
  });
});
