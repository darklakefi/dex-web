/** biome-ignore-all lint/suspicious/noExplicitAny: for testing purposes */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: for testing purposes */

import { PublicKey } from "@solana/web3.js";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "../src/app/page";
import { WalletContextProvider } from "../src/components/Solana/WalletContextProvider";

// Mock process.env.NETWORK
vi.stubEnv("NETWORK", "devnet");

// Mock @solana/web3.js
vi.mock("@solana/web3.js", () => ({
	clusterApiUrl: vi.fn(() => "https://api.devnet.solana.com"),
	WalletAdapterNetwork: {
		Mainnet: "mainnet-beta",
		Devnet: "devnet",
	},
	PublicKey: vi.fn().mockImplementation(() => {
		return {
			toString: vi.fn(() => "1234567890"),
			toBase58: vi.fn(() => "1234567890"),
		};
	}),
}));

// Mock wallet adapters
vi.mock("@solana/wallet-adapter-phantom", () => ({
	PhantomWalletAdapter: vi.fn().mockImplementation(() => ({
		name: "Phantom",
		connect: vi.fn(),
		disconnect: vi.fn(),
		signTransaction: vi.fn(),
		signAllTransactions: vi.fn(),
		signMessage: vi.fn(),
	})),
}));
vi.mock("@solana/wallet-adapter-solflare", () => ({
	SolflareWalletAdapter: vi.fn().mockImplementation(() => ({
		name: "Solflare",
		connect: vi.fn(),
		disconnect: vi.fn(),
		signTransaction: vi.fn(),
		signAllTransactions: vi.fn(),
		signMessage: vi.fn(),
	})),
}));
vi.mock("@solana/wallet-adapter-backpack", () => ({
	BackpackWalletAdapter: vi.fn().mockImplementation(() => ({
		name: "Backpack",
		connect: vi.fn(),
		disconnect: vi.fn(),
		signTransaction: vi.fn(),
		signAllTransactions: vi.fn(),
		signMessage: vi.fn(),
	})),
}));

// Mock @solana/wallet-adapter-react
vi.mock("@solana/wallet-adapter-react", () => ({
	ConnectionProvider: ({
		children,
		endpoint,
	}: {
		children: React.ReactNode;
		endpoint: string;
	}) => <div data-endpoint={endpoint}>{children}</div>,
	WalletProvider: ({
		children,
		wallets,
		onError,
		autoConnect,
	}: {
		children: React.ReactNode;
		wallets: any[];
		onError: any;
		autoConnect: boolean;
	}) => (
		<div data-wallets={wallets.length} data-auto-connect={autoConnect}>
			{children}
		</div>
	),
	useWallet: vi.fn().mockImplementation(() => ({
		connected: true,
		publicKey: new PublicKey("1234567890"),
		signTransaction: vi.fn(),
		signAllTransactions: vi.fn(),
		signMessage: vi.fn(),
	})),
}));

// Mock WalletModalProvider
vi.mock("./WalletModalProvider", () => ({
	WalletModalProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

describe("Page", () => {
	it("should render successfully", () => {
		const { baseElement } = render(
			<WalletContextProvider>
				<Page />
			</WalletContextProvider>,
		);
		expect(baseElement).toBeTruthy();
		expect(baseElement).toMatchSnapshot();
	});
});
