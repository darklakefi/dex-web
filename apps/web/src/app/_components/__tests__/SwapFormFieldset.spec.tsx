import { mockOrpc } from "../../[lang]/(swap)/_components/__tests__/__mocks__/mockOrpc";
mockOrpc();
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "../../_utils/constants";
import { FormFieldset } from "../FormFieldset";
vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));
const queryClient = new QueryClient();
const onUrlUpdate = vi.fn();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={{}}>
    <NuqsTestingAdapter
      onUrlUpdate={onUrlUpdate}
      searchParams={{
        tokenAAddress: DEFAULT_BUY_TOKEN,
        tokenBAddress: DEFAULT_SELL_TOKEN,
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsTestingAdapter>
  </NextIntlClientProvider>
);
describe.skip("SwapFormFieldset", () => {
  const handleChange = vi.fn();
  it("renders label, balance, and NumericInput", async () => {
    render(<FormFieldset name="tokenAAmount" onChange={handleChange} />, {
      wrapper,
    });
    expect(await screen.findByText("Half")).toBeDefined();
    expect(await screen.findByText("Max")).toBeDefined();
    expect(await screen.findByText("1000 SOL")).toBeDefined();
    expect(await screen.findByPlaceholderText("0.00")).toBeDefined();
  });
});