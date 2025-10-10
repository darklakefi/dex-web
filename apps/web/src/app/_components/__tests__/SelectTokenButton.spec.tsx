import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { SelectTokenButton } from "../SelectTokenButton";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: vi.fn(() => ({
      data: {
        tokens: [
          {
            address: "abc",
            logoUri: "",
            symbol: "SOL",
          },
          {
            address: "def",
            logoUri: "",
            symbol: "USDC",
          },
        ],
      },
    })),
  };
});

vi.mock("@dex-web/orpc", () => ({
  tanstackClient: {
    dexGateway: {
      getTokenMetadataList: {
        queryOptions: vi.fn(() => ({
          queryFn: () =>
            Promise.resolve({
              tokens: [
                {
                  address: "abc",
                  logoUri: "",
                  symbol: "SOL",
                },
                {
                  address: "def",
                  logoUri: "",
                  symbol: "USDC",
                },
              ],
            }),
          queryKey: ["tokenMetadata", "abc", "def"],
        })),
      },
    },
  },
  tokenQueryKeys: {
    metadata: {
      byAddresses: vi.fn((addresses: string[]) => [
        "tokenMetadata",
        ...addresses,
      ]),
    },
  },
}));

vi.mock("@dex-web/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dex-web/utils")>();
  return {
    ...actual,
    sortSolanaAddresses: vi.fn((tokenA: string, tokenB: string) => ({
      tokenXAddress: tokenA,
      tokenYAddress: tokenB,
    })),
  };
});

vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/swap",
  useSearchParams: () => ({
    toString: () => "tokenAAddress=abc&tokenBAddress=def",
  }),
}));

describe("SelectTokenButton", () => {
  it("renders token symbol and chevron icon", () => {
    const onUrlUpdate = vi.fn();

    render(<SelectTokenButton type="buy" />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        searchParams: "?tokenAAddress=abc&tokenBAddress=def",
      }),
    });

    expect(screen.getAllByRole("img", { hidden: true })[0]).toBeInTheDocument();
  });
});
