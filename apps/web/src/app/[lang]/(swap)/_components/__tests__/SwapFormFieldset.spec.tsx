import { mockOrpc } from "./__mocks__/mockOrpc";

mockOrpc();

import "@testing-library/jest-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { SwapFormFieldset } from "../SwapFormFieldset";

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

describe("SwapFormFieldset", () => {
  const handleChange = vi.fn();

  it("renders label, balance, and NumericInput", async () => {
    render(<SwapFormFieldset name="buyAmount" onChange={handleChange} />, {
      wrapper,
    });
    expect(await screen.findByText("Half")).toBeDefined();
    expect(await screen.findByText("Max")).toBeDefined();
    expect(await screen.findByText("1000 SOL")).toBeDefined();
    expect(await screen.findByPlaceholderText("Amount")).toBeDefined();
  });
});
