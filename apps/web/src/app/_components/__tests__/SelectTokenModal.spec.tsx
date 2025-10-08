import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BUY_TOKEN } from "../../_utils/constants";
import { SelectTokenModal } from "../SelectTokenModal";

const queryClient = new QueryClient();
const onUrlUpdate = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/swap",
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(""),
  }),
}));
vi.mock("@dex-web/orpc", () => ({
  QUERY_CONFIG: {
    tokenSearch: {
      gcTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
    tokens: {
      gcTime: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    },
  },
  tanstackClient: {
    tokens: {
      getTokensWithPools: {
        queryOptions: vi.fn().mockReturnValue({
          queryFn: () =>
            Promise.resolve({
              hasMore: false,
              poolTokenAddresses: [],
              tokens: [
                {
                  address: DEFAULT_BUY_TOKEN,
                  imageUrl: "https://example.com/solana.png",
                  name: "Solana",
                  symbol: "SOL",
                },
              ],
              total: 1,
            }),
          queryKey: [
            "tokens",
            "list",
            { limit: 8, offset: 0, onlyWithPools: false, query: "" },
          ],
        }),
      },
    },
  },
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: null,
  }),
}));
vi.mock("../../hooks/useWalletCache", () => ({
  useWalletPublicKey: () => ({
    data: {
      toBase58: () => "mock-public-key",
    },
  }),
}));
vi.mock("@dex-web/utils", () => ({
  pasteFromClipboard: vi.fn(),
}));
vi.mock("use-local-storage-state", () => ({
  default: vi.fn().mockReturnValue([[], vi.fn()]),
}));
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NuqsTestingAdapter
    onUrlUpdate={onUrlUpdate}
    searchParams="?tokenAAddress=abc&tokenBAddress=def"
  >
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </NuqsTestingAdapter>
);
describe("SelectTokenModal", () => {
  it("renders search input and token list", async () => {
    await act(async () => {
      render(<SelectTokenModal returnUrl="/" type="buy" />, {
        wrapper,
      });
    });
    expect(
      await screen.findByPlaceholderText("Search for a token"),
    ).toBeDefined();
    expect(await screen.findByText("SOL")).toBeDefined();
    expect(await screen.findByText("Solana")).toBeDefined();
  });
});
