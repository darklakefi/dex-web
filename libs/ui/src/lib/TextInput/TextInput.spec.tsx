/// <reference types="@vitest/browser/context" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { describe, expect, it } from "vitest";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  it("should render successfully without props", () => {
    const { baseElement } = render(<TextInput label="First Name" />);
    expect(baseElement).toBeTruthy();
  });

  it("should render successfully with padding and background explicitly set", () => {
    render(<TextInput label="First Name" />);

    const inputElement = screen.getAllByRole("textbox")[0];
    const labelElement = inputElement?.closest("label");
    expect(labelElement).toBeTruthy();
    expect(labelElement).toHaveClass("bg-green-600");
  });

  it("should allow custom props to be passed through", () => {
    render(<TextInput data-testid="firstName" label="First Name" />);

    const textInputElement = screen.getByTestId("firstName");
    expect(textInputElement).toBeTruthy();
  });
});
