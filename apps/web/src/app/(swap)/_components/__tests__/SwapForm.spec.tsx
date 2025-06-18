import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapForm } from "../SwapForm";

vi.mock("@dex-web/orpc", () => ({
  client: {
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

describe("SwapForm", () => {
  it("renders both buy and sell sections", async () => {
    render(<SwapForm />, { wrapper });
    screen.debug();
    expect(await screen.findByText("Buying")).toBeDefined();
    expect(await screen.findByText("Selling")).toBeDefined();
    expect(await screen.findAllByLabelText(/Amount/)).toHaveLength(2);
    expect(await screen.findAllByText("100")).toHaveLength(2);
  });
});
