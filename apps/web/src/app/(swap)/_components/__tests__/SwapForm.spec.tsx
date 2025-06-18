import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SwapForm } from "../SwapForm";

describe("SwapForm", () => {
  it("renders both buy and sell sections", () => {
    render(<SwapForm />);
    expect(screen.getAllByText(/Buying|Selling/)).toHaveLength(2);
    expect(screen.getAllByLabelText(/Amount/)).toHaveLength(2);
    expect(screen.getAllByText("100")).toHaveLength(2); // balance
  });
});
