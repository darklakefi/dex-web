import type { Pool } from "@dex-web/core";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortPoolPanel } from "../../[lang]/(swap)/_components/ShortPoolPanel";
const pools = [
  {
    apr: 5,
    tokenXMint: "1",
    tokenXSymbol: "SOL",
    tokenYMint: "2",
    tokenYSymbol: "USDC",
  },
] satisfies Pool[];
describe("ShortPoolPanel", () => {
  it("renders title, icon, and pool data", () => {
    render(
      <ShortPoolPanel
        icon="crown"
        onPoolClick={() => {}}
        pools={pools}
        title="Featured"
      />,
    );
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getAllByText("SOL")[0]).toBeInTheDocument();
    expect(screen.getAllByText("USDC")[0]).toBeInTheDocument();
  });
});