import type { Pool } from "@dex-web/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturesAndTrendingPoolPanel } from "../FeaturesAndTrendingPoolPanel";
import { mockOrpc } from "./__mocks__/mockOrpc";

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

mockOrpc();

describe("FeaturesAndTrendingPoolPanel", () => {
  it("renders featured and trending pool panels and explore button", () => {
    render(
      <FeaturesAndTrendingPoolPanel
        featuredPools={[pool]}
        trendingPools={[pool]}
      />,
    );
    expect(screen.getByText("Featured Pools")).toBeDefined();
    expect(screen.getByText("Trending Pools")).toBeDefined();
    expect(screen.getByText("explore all pools")).toBeDefined();
  });
});
