import { mockOrpc } from "./__mocks__/mockOrpc";
mockOrpc();
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";
const queryClient = new QueryClient();
const onUrlUpdate = vi.fn();
const _wrapper = ({ children }: { children: React.ReactNode }) => (
  <NuqsTestingAdapter
    onUrlUpdate={onUrlUpdate}
    searchParams={{
      tokenAAddress: DEFAULT_BUY_TOKEN,
      tokenBAddress: DEFAULT_SELL_TOKEN,
    }}
  >
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </NuqsTestingAdapter>
);
describe.skip("SwapDetails", () => {
  it("renders", async () => {
    expect(await screen.findByText("Price")).toBeDefined();
    expect(await screen.findByText("Price Impact")).toBeDefined();
    expect(await screen.findByText("Max Slippage")).toBeDefined();
    expect(await screen.findByText("MEV Protection")).toBeDefined();
    expect(await screen.findByText("Est. Fees")).toBeDefined();
  });
});