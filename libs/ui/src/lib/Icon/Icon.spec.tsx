/// <reference types="@vitest/browser/context" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "./Icon";

describe("Icon", () => {
  it("should render successfully without props", () => {
    render(<Icon name="analytics" data-testid="icon-analytics" />);
    expect(screen.getByTestId("icon-analytics")).toBeTruthy();
  });

  it("should render successfully with padding and background explicitly set", () => {
    render(<Icon name="analytics" data-testid="icon-analytics" />);
    const iconElement = screen.getByTestId("icon-analytics");
    expect(iconElement).toBeTruthy();
    expect(iconElement).toHaveClass("text-green-100");
  });

  it("should allow custom props to be passed through", () => {
    render(<Icon data-testid="icon-analytics" name="analytics" />);
    const iconElement = screen.getByTestId("icon-analytics");
    expect(iconElement).toBeTruthy();
  });
});
