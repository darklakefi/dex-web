import type { Pool } from "@dex-web/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturesAndTrendingPoolPanel } from "../FeaturesAndTrendingPoolPanel";

const pool = {
  id: "1",
  address: "1",
  tokenX: {
    id: "1",
    address: "1",
    symbol: "SOL",
    name: "SOL",
    decimals: 9,
  },
  tokenY: {
    id: "2",
    address: "2",
    symbol: "USDC",
    name: "USDC",
    decimals: 6,
  },
  apr: 5,
} satisfies Pool;

describe("FeaturesAndTrendingPoolPanel", () => {
  it("renders featured and trending pool panels and explore button", () => {
    render(
      <FeaturesAndTrendingPoolPanel
        featuredPools={[pool]}
        trendingPools={[pool]}
      />,
    );
    expect(screen.getByText("Featured Pools")).toBeInTheDocument();
    expect(screen.getByText("Trending Pools")).toBeInTheDocument();
    expect(screen.getByText("explore all pools")).toBeInTheDocument();
  });
});
