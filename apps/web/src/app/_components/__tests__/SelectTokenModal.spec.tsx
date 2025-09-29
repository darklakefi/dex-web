import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import z from "zod/v4";
import { DEFAULT_BUY_TOKEN } from "../../_utils/constants";
import { SelectTokenModal } from "../SelectTokenModal";
const queryClient = new QueryClient();
const onUrlUpdate = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(""),
  }),
  usePathname: () => "/swap",
}));
vi.mock("@dex-web/orpc", () => ({
  getTokensInputSchema: {
    pick: vi.fn().mockReturnValue(
      z.object({
        limit: z.number(),
        offset: z.number(),
        query: z.string(),
      }),
    ),
  },
  tanstackClient: {
    getTokens: {
      queryOptions: vi.fn().mockReturnValue({
        queryFn: () =>
          Promise.resolve({
            tokens: [
              {
                address: DEFAULT_BUY_TOKEN,
                imageUrl: "https://example.com/solana.png",
                name: "Solana",
                symbol: "SOL",
                value: "1000",
              },
            ],
          }),
        queryKey: ["getTokens"],
      }),
    },
  },
}));
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NuqsTestingAdapter
    onUrlUpdate={onUrlUpdate}
    searchParams="?tokenAAddress=abc&tokenBAddress=def"
  >
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </NuqsTestingAdapter>
);
describe.skip("SelectTokenModal", () => {
  it("renders search input and token list", async () => {
    await act(async () => {
      render(<SelectTokenModal returnUrl="/" type="buy" />, {
        wrapper,
      });
    });
    expect(
      await screen.findByPlaceholderText("Search for a token"),
    ).toBeDefined();
    expect(await screen.findAllByText("SOL")).toHaveLength(1);
    expect(await screen.findAllByText("Solana")).toHaveLength(1);
  });
});
