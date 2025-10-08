import enMessages from "../../../../../locale/en.json";
import { mockOrpc } from "../../../(swap)/_components/__tests__/__mocks__/mockOrpc";

mockOrpc();

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
} from "../../../../_utils/constants";
import { CreatePoolForm } from "../CreatePoolForm";

vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/liquidity",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: null,
    signTransaction: vi.fn(),
    wallet: null,
  }),
}));
vi.mock("../../../../hooks/useAnalytics", () => ({
  useAnalytics: () => ({
    trackError: vi.fn(),
    trackLiquidity: vi.fn(),
  }),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={enMessages}>
    <NuqsTestingAdapter
      searchParams={{
        tokenAAddress: DEFAULT_BUY_TOKEN,
        tokenBAddress: DEFAULT_SELL_TOKEN,
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsTestingAdapter>
  </NextIntlClientProvider>
);

describe("CreatePoolForm", () => {
  it("renders the create pool form", async () => {
    render(<CreatePoolForm />, { wrapper });
    expect(await screen.findByText("SELECT TOKEN")).toBeDefined();
    expect(await screen.findByText("TOKEN")).toBeDefined();
  });
});
