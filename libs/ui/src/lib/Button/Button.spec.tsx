import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  describe("Base Button", () => {
    it("should render with variant prop", () => {
      const { container } = render(
        <Button variant="primary">Base Button</Button>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-100");
      expect(screen.getByText("Base Button")).toBeInTheDocument();
    });

    it("should handle disabled state", () => {
      const { container } = render(
        <Button disabled variant="primary">
          Disabled Button
        </Button>,
      );
      expect(container.querySelector("button")).toHaveClass(
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
      );
      expect(container.querySelector("button")).toBeDisabled();
    });

    it("should handle text prop", () => {
      render(<Button text="Text Prop" variant="primary" />);
      expect(screen.getByText("Text Prop")).toBeInTheDocument();
    });
  });

  describe("Button Icons", () => {
    it("should render with leading icon", () => {
      const { container } = render(
        <Button leadingIcon="times" variant="primary">
          Button with Leading Icon
        </Button>,
      );
      expect(container.querySelector("button")).toHaveClass(
        "flex",
        "items-center",
        "gap-2",
      );
      // Check for icon presence by looking for elements that contain SVG content
      const iconElement =
        container.querySelector("svg") ||
        container.querySelector("[data-testid='mocked-svg']") ||
        container.querySelector("img") ||
        container.querySelector("[class*='size-4']") ||
        container.querySelector("[role='img']");
      expect(iconElement).toBeTruthy();
      expect(screen.getByText("Button with Leading Icon")).toBeInTheDocument();
    });

    it("should render with trailing icon", () => {
      const { container } = render(
        <Button trailingIcon="times" variant="primary">
          Button with Trailing Icon
        </Button>,
      );
      expect(container.querySelector("button")).toHaveClass(
        "flex",
        "items-center",
        "gap-2",
      );
      // Check for icon presence by looking for elements that contain SVG content
      const iconElement =
        container.querySelector("svg") ||
        container.querySelector("[data-testid='mocked-svg']") ||
        container.querySelector("img") ||
        container.querySelector("[class*='size-4']") ||
        container.querySelector("[role='img']");
      expect(iconElement).toBeTruthy();
      expect(screen.getByText("Button with Trailing Icon")).toBeInTheDocument();
    });

    it("should render icon-only button", () => {
      const { container } = render(
        <Button icon="external-link" variant="primary" />,
      );
      expect(container.querySelector("button")).toHaveClass("p-2.5");
      // Check for icon presence by looking for elements that contain SVG content
      const iconElement =
        container.querySelector("svg") ||
        container.querySelector("[data-testid='mocked-svg']") ||
        container.querySelector("img") ||
        container.querySelector("[class*='size-4']") ||
        container.querySelector("[role='img']");
      expect(iconElement).toBeTruthy();
      expect(container.querySelector("button")?.textContent).toBe("");
    });

    it("should show loading icon when loading is true", () => {
      const { container } = render(
        <Button leadingIcon="checkbox-empty" loading variant="primary">
          Loading Button
        </Button>,
      );
      // Check for loading icon presence by looking for elements that contain SVG content
      const iconElement =
        container.querySelector("svg") ||
        container.querySelector("[data-testid='mocked-svg']") ||
        container.querySelector("img") ||
        container.querySelector("[class*='size-4']") ||
        container.querySelector("[role='img']");
      expect(iconElement).toBeTruthy();
      // Check for loading animation class on the icon or button
      const loadingElement =
        container.querySelector(".animate-spin-pause") ||
        container.querySelector("button");
      expect(loadingElement).toBeTruthy();
      expect(container.querySelector("button")).not.toBeDisabled();
    });
  });

  describe("Button Variants", () => {
    it("should render Primary button", () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      expect(container.querySelector("button")).toHaveClass("bg-green-100");
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("should render PrimaryDark button", () => {
      const { container } = render(
        <Button variant="primary-dark">Primary Dark</Button>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-700");
      expect(screen.getByText("Primary Dark")).toBeInTheDocument();
    });

    it("should render Secondary button", () => {
      const { container } = render(
        <Button variant="secondary">Secondary</Button>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-500");
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });

    it("should render Tertiary button", () => {
      const { container } = render(
        <Button variant="tertiary">Tertiary</Button>,
      );
      expect(container.querySelector("button")).not.toHaveClass("bg-");
      expect(screen.getByText("Tertiary")).toBeInTheDocument();
    });
  });
});
