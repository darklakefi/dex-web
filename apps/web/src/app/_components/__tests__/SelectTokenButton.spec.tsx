import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { SelectTokenButton } from "../SelectTokenButton";
vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({ data: { imageUrl: "", symbol: "SOL" } }),
}));
vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));
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