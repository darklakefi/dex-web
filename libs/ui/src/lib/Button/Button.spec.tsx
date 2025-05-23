import { render, screen } from "@testing-library/react";

import Button from "./index";

describe("Button", () => {
  describe("Base Button", () => {
    it("should render with variant prop", () => {
      const { container } = render(
        <Button variant="primary">Base Button</Button>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-10");
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

  describe("Button Variants", () => {
    it("should render Primary button", () => {
      const { container } = render(<Button.Primary>Primary</Button.Primary>);
      expect(container.querySelector("button")).toHaveClass("bg-green-10");
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("should render PrimaryDark button", () => {
      const { container } = render(
        <Button.PrimaryDark>Primary Dark</Button.PrimaryDark>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-70");
      expect(screen.getByText("Primary Dark")).toBeInTheDocument();
    });

    it("should render Secondary button", () => {
      const { container } = render(
        <Button.Secondary>Secondary</Button.Secondary>,
      );
      expect(container.querySelector("button")).toHaveClass("bg-green-50");
      expect(screen.getByText("Secondary")).toBeInTheDocument();
    });

    it("should render Tertiary button", () => {
      const { container } = render(<Button.Tertiary>Tertiary</Button.Tertiary>);
      expect(container.querySelector("button")).not.toHaveClass("bg-");
      expect(screen.getByText("Tertiary")).toBeInTheDocument();
    });
  });
});
