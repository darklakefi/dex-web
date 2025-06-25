import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapFormFieldsets } from "../SwapFormFieldsets";

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
    expect(await screen.findAllByText("0")).toHaveLength(2);
  });
});
