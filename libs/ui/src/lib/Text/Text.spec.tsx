/// <reference types="@vitest/browser/context" />
import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Text } from "./Text";

describe("Text", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render heading", () => {
    render(<Text.Heading>Hello</Text.Heading>);
    const heading = screen.getByText("Hello");
    expect(heading).toBeTruthy();
  });

  it("should render body1", () => {
    render(<Text.Body1>Hello</Text.Body1>);
    const body1 = screen.getByText("Hello");
    expect(body1).toBeTruthy();
  });

  it("should render body2", () => {
    render(<Text.Body2>Hello</Text.Body2>);
    const body2 = screen.getByText("Hello");
    expect(body2).toBeTruthy();
  });

  it("should render body2 lowercase", () => {
    render(<Text.Body2 textCase="lowercase">Hello</Text.Body2>);
    const body2 = screen.getByText("Hello");
    expect(body2).toHaveClass("lowercase");
  });

  it("should render link", () => {
    render(<Text.Link>Hello</Text.Link>);
    const link = screen.getByText("Hello");
    expect(link).toBeTruthy();
  });
});
