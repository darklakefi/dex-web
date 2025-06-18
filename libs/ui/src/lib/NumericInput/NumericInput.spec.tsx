/// <reference types="@vitest/browser/context" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";
import { NumericInput } from "./NumericInput";

describe("NumericInput", () => {
  it("should render successfully without props", () => {
    const { baseElement } = render(<NumericInput placeholder="First Name" />);
    expect(baseElement).toBeTruthy();
  });

  it("should render successfully with padding and background explicitly set", () => {
    render(<NumericInput placeholder="First Name" />);

    const inputElement = screen.getAllByRole("spinbutton")[0];
    expect(inputElement).toBeTruthy();
    expect(inputElement).toHaveClass("bg-green-600");
  });

  it("should allow custom props to be passed through", () => {
    render(<NumericInput data-testid="firstName" placeholder="First Name" />);

    const textInputElement = screen.getByTestId("firstName");
    expect(textInputElement).toBeTruthy();
  });
});
