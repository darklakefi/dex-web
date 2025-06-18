import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TokenList } from "../TokenList";

const tokens = [
  {
    address: "So11111111111111111111111111111111111111112",
    imageUrl: "",
    name: "Solana",
    symbol: "SOL",
    value: "SOL",
  },
];

describe("TokenList", () => {
  it("renders token symbol, name, and truncated address", () => {
    render(<TokenList onSelect={() => {}} tokens={tokens} />);
    expect(screen.getByText("SOL")).toBeInTheDocument();
    expect(screen.getByText("Solana")).toBeInTheDocument();
    expect(screen.getByText(/So11.*1112/)).toBeInTheDocument();
  });

  it("calls onSelect when a token is clicked", () => {
    const onSelect = vi.fn();
    render(<TokenList onSelect={onSelect} tokens={tokens} />);
    const button = screen.getAllByRole("button")[0];
    expect(button).toBeInTheDocument();
    button && fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(tokens[0]?.address);
  });
});
