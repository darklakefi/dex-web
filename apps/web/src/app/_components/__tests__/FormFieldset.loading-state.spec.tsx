import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { FormFieldset } from "../FormFieldset";

vi.mock("../../../_utils/useFormatPrice", () => ({
  useFormatPrice: vi.fn(() => "$0.00"),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  const onUrlUpdate = vi.fn();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale="en" messages={{}}>
      <NuqsTestingAdapter
        onUrlUpdate={onUrlUpdate}
        searchParams={{ tokenAAddress: "token-a", tokenBAddress: "token-b" }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </NextIntlClientProvider>
  );

  return { Wrapper };
};

describe("FormFieldset loading visuals", () => {
  it("does not render inline spinner when refreshing token balances", () => {
    const { Wrapper } = createWrapper();

    const { container } = render(
      <FormFieldset
        isLoading={false}
        isRefreshing
        name="tokenAmount"
        onBlur={vi.fn()}
        onChange={vi.fn()}
        onClearPendingCalculations={vi.fn()}
        onHalfMaxClick={vi.fn()}
        tokenAccount={{
          address: "test-account",
          amount: 1_000_000,
          decimals: 6,
          symbol: "USDC",
        }}
        value=""
      />,
      { wrapper: Wrapper },
    );

    expect(container.querySelector(".animate-spin")).toBeNull();
    const balanceRow = screen.getByText(/USDC/);
    expect(balanceRow).toHaveTextContent(/1\s+USDC/i);
  });
});
