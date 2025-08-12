import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { TokenList } from "../../[lang]/(swap)/_components/TokenList";

const tokens = [
  {
    address: "So11111111111111111111111111111111111111112",
    decimals: 9,
    imageUrl: "",
    name: "Solana",
    symbol: "SOL",
    value: "SOL",
  },
];

describe.skip("TokenList", () => {
  it("renders token symbol, name, and truncated address", () => {
    const onSelect = vi.fn();
    const onUrlUpdate = vi.fn();
    render(<TokenList onSelect={onSelect} tokens={tokens} />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        searchParams: "?tokenAAddress=abc&tokenBAddress=def",
      }),
    });
    expect(screen.getAllByText("SOL")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Solana")[0]).toBeInTheDocument();
    expect(screen.getByText(/So11.*1112/)).toBeInTheDocument();
  });

  it("calls onSelect when a token is clicked", () => {
    const onSelect = vi.fn();
    const onUrlUpdate = vi.fn();
    render(<TokenList onSelect={onSelect} tokens={tokens} />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        searchParams: "?tokenAAddress=abc&tokenBAddress=def",
      }),
    });
    const button = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("SOL"))[0];
    expect(button).toBeInTheDocument();
    button && fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(tokens[0]?.address);
  });
});
