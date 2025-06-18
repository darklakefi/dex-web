import type { Pool } from "@dex-web/core";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortPoolPanel } from "../ShortPoolPanel";

const pools = [
  {
    address: "1",
    apr: 5,
    id: "1",
    tokenX: { address: "1", decimals: 9, id: "1", name: "SOL", symbol: "SOL" },
    tokenY: {
      address: "2",
      decimals: 6,
      id: "2",
      name: "USDC",
      symbol: "USDC",
    },
  },
] satisfies Pool[];

describe("ShortPoolPanel", () => {
  it("renders title, icon, and pool data", () => {
    render(<ShortPoolPanel icon="crown" pools={pools} title="Featured" />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("SOL")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("5%"));
  });
});
