import type { Pool } from "@dex-web/core";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortPoolPanel } from "../ShortPoolPanel";

const pools = [
	{
		id: "1",
		address: "1",
		tokenX: { id: "1", address: "1", name: "SOL", decimals: 9, symbol: "SOL" },
		tokenY: {
			id: "2",
			address: "2",
			name: "USDC",
			decimals: 6,
			symbol: "USDC",
		},
		apr: 5,
	},
] satisfies Pool[];

describe("ShortPoolPanel", () => {
	it("renders title, icon, and pool data", () => {
		render(<ShortPoolPanel pools={pools} title="Featured" icon="crown" />);
		expect(screen.getByText("Featured")).toBeInTheDocument();
		expect(screen.getByText("SOL")).toBeInTheDocument();
		expect(screen.getByText("USDC")).toBeInTheDocument();
		expect(screen.getByText("5%"));
	});
});
