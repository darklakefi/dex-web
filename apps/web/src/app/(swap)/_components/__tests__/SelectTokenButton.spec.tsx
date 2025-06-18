import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectTokenButton } from "../SelectTokenButton";

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({ data: { symbol: "SOL", imageUrl: "" } }),
}));
vi.mock("../_utils/searchParams", () => ({
  selectedTokensCache: {
    all: () => ({ buyTokenAddress: "abc", sellTokenAddress: "def" }),
  },
}));
vi.mock("next/link", () => ({ default: (props: any) => <a {...props} /> }));

describe("SelectTokenButton", () => {
  it("renders token symbol and chevron icon", () => {
    render(<SelectTokenButton type="buy" />);
    expect(screen.getByText("SOL")).toBeInTheDocument();
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument(); // Icon
  });
});
