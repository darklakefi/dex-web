/// <reference types="@vitest/browser/context" />
import "@testing-library/jest-dom";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Hero } from "./Hero";

describe("Hero", () => {
  const defaultProps = {
    image: "/test-image.png",
  };

  afterEach(() => {
    cleanup();
  });

  it("should render successfully with required props", () => {
    render(
      <Hero data-testid="hero" {...defaultProps}>
        Content
      </Hero>,
    );
    expect(screen.getByTestId("hero")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByAltText("Waddles")).toBeTruthy();
  });

  it("should render image at the end by default", () => {
    render(<Hero {...defaultProps}>Content</Hero>);
    const image = screen.getByAltText("Waddles");
    expect(image.parentElement).toHaveClass("self-end");
  });

  it("should render image at the start when specified", () => {
    render(
      <Hero {...defaultProps} imagePosition="start">
        Content
      </Hero>,
    );
    const image = screen.getByAltText("Waddles");
    expect(image.parentElement).toHaveClass("self-start");
  });

  it("should apply custom image dimensions", () => {
    render(
      <Hero {...defaultProps} imageHeight={500} imageWidth={300}>
        Content
      </Hero>,
    );
    const image = screen.getByAltText("Waddles");
    expect(image).toHaveAttribute("height", "500");
    expect(image).toHaveAttribute("width", "300");
  });

  it("should apply custom className", () => {
    render(
      <Hero {...defaultProps} className="custom-class">
        Content
      </Hero>,
    );
    expect(screen.getByTestId("hero")).toHaveClass("custom-class");
  });
});
