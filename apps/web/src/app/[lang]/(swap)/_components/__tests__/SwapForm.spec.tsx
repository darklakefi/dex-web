import { mockOrpc } from "./__mocks__/mockOrpc";

mockOrpc();

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapForm } from "../SwapForm";

vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams({
      buyTokenAddress: DEFAULT_BUY_TOKEN,
      sellTokenAddress: DEFAULT_SELL_TOKEN,
    }),
}));

const queryClient = new QueryClient();
const onUrlUpdate = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={{}}>
    <NuqsTestingAdapter
      onUrlUpdate={onUrlUpdate}
      searchParams={{
        buyTokenAddress: DEFAULT_BUY_TOKEN,
        sellTokenAddress: DEFAULT_SELL_TOKEN,
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsTestingAdapter>
  </NextIntlClientProvider>
);

describe.skip("SwapForm", () => {
  it("renders both buy and sell sections", async () => {
    render(<SwapForm />, { wrapper });
    expect(await screen.findByText("Buying")).toBeDefined();
    expect(await screen.findByText("Selling")).toBeDefined();
    expect(await screen.findAllByText("Half")).toHaveLength(2);
    expect(await screen.findAllByText("1000 SOL"));
  });
});
