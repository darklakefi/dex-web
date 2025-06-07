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
        <Button variant="primary" disabled>
          Disabled Button
        </Button>,
      );
      expect(container.querySelector("button")).toHaveClass(
        "cursor-not-allowed",
        "opacity-50",
      );
      expect(container.querySelector("button")).toBeDisabled();
    });

    it("should handle text prop", () => {
      render(<Button variant="primary" text="Text Prop" />);
      expect(screen.getByText("Text Prop")).toBeInTheDocument();
    });
  });

  describe("Button Icons", () => {
    it("should render with leading icon", () => {
      const { container } = render(
        <Button variant="primary" leadingIcon="checkbox-filled">
          Button with Leading Icon
        </Button>,
      );
      expect(container.querySelector("button")).toHaveClass(
        "flex",
        "items-center",
        "gap-2",
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText("Button with Leading Icon")).toBeInTheDocument();
    });

    it("should render with trailing icon", () => {
      const { container } = render(
        <Button variant="primary" trailingIcon="times">
          Button with Trailing Icon
        </Button>,
      );
      expect(container.querySelector("button")).toHaveClass(
        "flex",
        "items-center",
        "gap-2",
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(screen.getByText("Button with Trailing Icon")).toBeInTheDocument();
    });

    it("should render icon-only button", () => {
      const { container } = render(
        <Button variant="primary" icon="external-link" />,
      );
      expect(container.querySelector("button")).toHaveClass("p-2.5");
      expect(container.querySelector("svg")).toBeInTheDocument();
      expect(container.querySelector("button")?.textContent).toBe("");
    });

    it("should show loading icon when isLoading is true", () => {
      const { container } = render(
        <Button variant="primary" isLoading leadingIcon="checkbox-empty">
          Loading Button
        </Button>,
      );
      expect(container.querySelector("svg")).toHaveClass("animate-spin");
      expect(container.querySelector("button")).toBeDisabled();
    });
  });

  describe("Button Variants", () => {
    it("should render Primary button", () => {
      const { container } = render(<Button.Primary>Primary</Button.Primary>);
      expect(container.querySelector("button")).toHaveClass("bg-green-100");
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("should render PrimaryDark button", () => {
      const { container } = render(
        <Button.PrimaryDark>Primary Dark</Button.PrimaryDark>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-700");
      expect(screen.getByText("Primary Dark")).toBeInTheDocument();
    });

    it("should render Secondary button", () => {
      const { container } = render(
        <Button.Secondary>Secondary</Button.Secondary>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-500");
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });

    it("should render Tertiary button", () => {
      const { container } = render(<Button.Tertiary>Tertiary</Button.Tertiary>);
      expect(container.querySelector("button")).not.toHaveClass("bg-");
      expect(screen.getByText("Tertiary")).toBeInTheDocument();
    });
  });
});
