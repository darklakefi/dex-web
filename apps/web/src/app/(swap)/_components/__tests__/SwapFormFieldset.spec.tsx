import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SwapFormFieldset } from "../SwapFormFieldset";

describe("SwapFormFieldset", () => {
  it("renders label, balance, and NumericInput", () => {
    render(<SwapFormFieldset balance={42} label="Amount" />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
  });
});
