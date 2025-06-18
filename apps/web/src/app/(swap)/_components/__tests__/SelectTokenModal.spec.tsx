import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectTokenModal } from "../SelectTokenModal";

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({
    data: {
      tokens: [{ address: "abc", imageUrl: "", name: "Solana", symbol: "SOL" }],
    },
  }),
}));
vi.mock("@dex-web/orpc", () => ({
  getTokensInputSchema: { pick: () => ({}) },
  tanstackClient: { getTokens: { queryOptions: () => ({}) } },
}));
vi.mock("../_utils/searchParams", () => ({
  selectedTokensParsers: {},
}));
vi.mock("nuqs", () => ({
  useQueryStates: () => [
    [{ buyTokenAddress: "abc", sellTokenAddress: "def" }, vi.fn()],
  ],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("SelectTokenModal", () => {
  it("renders search input and token list", () => {
    render(<SelectTokenModal type="buy" />);
    expect(
      screen.getByPlaceholderText("Search for a token"),
    ).toBeInTheDocument();
    expect(screen.getByText("SOL")).toBeInTheDocument();
    expect(screen.getByText("Solana")).toBeInTheDocument();
  });
});
