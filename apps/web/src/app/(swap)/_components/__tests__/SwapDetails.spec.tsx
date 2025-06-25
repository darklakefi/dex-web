import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapDetails } from "../SwapDetails";

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
