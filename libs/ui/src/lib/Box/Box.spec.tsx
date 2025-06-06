/// <reference types="@vitest/browser/context" />
import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Box } from "./Box";

describe("Box", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render successfully without props", () => {
    render(<Box data-testid="box">Box</Box>);
    expect(screen.getByTestId("box")).toBeTruthy();
  });

  it("should render successfully with padding and background explicitly set", () => {
    render(
      <Box padding="lg" background="base">
        Box
      </Box>,
    );

    const boxElement = screen.getByText("Box");
    expect(boxElement).toBeTruthy();
    expect(boxElement).toHaveClass("p-6");
    expect(boxElement).toHaveClass("bg-green-700");
  });

  it("should allow custom props to be passed through", () => {
    render(<Box data-testid="box">Box</Box>);
    const boxElement = screen.getByTestId("box");
    expect(boxElement).toBeTruthy();
  });
});
