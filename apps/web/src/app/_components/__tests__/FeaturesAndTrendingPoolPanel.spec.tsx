import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturesAndTrendingPoolPanel } from "../FeaturesAndTrendingPoolPanel";

describe.skip("FeaturesAndTrendingPoolPanel", () => {
  it("renders featured and trending pool panels and explore button", () => {
    render(<FeaturesAndTrendingPoolPanel />);
    expect(screen.getByText("Featured Pools")).toBeDefined();
    expect(screen.getByText("Trending Pools")).toBeDefined();
    expect(screen.getByText("explore all pools")).toBeDefined();
  });
});
