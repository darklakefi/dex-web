import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SwapFormFieldset } from "../SwapFormFieldset";
import { mockOrpc } from "./__mocks__/mockOrpc";

mockOrpc();
vi.mock("next/link", () => ({ default: (props: object) => <a {...props} /> }));

describe("SwapFormFieldset", () => {
  it("renders label, balance, and NumericInput", () => {
    render(<SwapFormFieldset balance={42} label="Amount" />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
  });
});
