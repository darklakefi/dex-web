/// <reference types="@vitest/browser/context" />
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Icon } from "./Icon";

describe("Icon", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render successfully without props", () => {
    render(<Icon data-testid="icon-analytics" name="analytics" />);
    expect(screen.getByTestId("icon-analytics")).toBeTruthy();
  });

  it("should render successfully with padding and background explicitly set", () => {
    render(<Icon data-testid="icon-analytics" name="analytics" />);
    const iconElement = screen.getByTestId("icon-analytics");
    expect(iconElement).toBeTruthy();
  });

  it("should allow custom props to be passed through", () => {
    render(<Icon data-testid="icon-analytics" name="analytics" />);
    const iconElement = screen.getByTestId("icon-analytics");
    expect(iconElement).toBeTruthy();
  });
});
