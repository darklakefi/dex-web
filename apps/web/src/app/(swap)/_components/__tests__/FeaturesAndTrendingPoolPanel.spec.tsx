import type { Pool } from "@dex-web/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturesAndTrendingPoolPanel } from "../FeaturesAndTrendingPoolPanel";

const pool = {
  address: "1",
  apr: 5,
  id: "1",
  tokenX: {
    address: "1",
    decimals: 9,
    id: "1",
    name: "SOL",
    symbol: "SOL",
  },
  tokenY: {
    address: "2",
    decimals: 6,
    id: "2",
    name: "USDC",
    symbol: "USDC",
  },
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
