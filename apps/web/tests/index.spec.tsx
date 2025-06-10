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
  PublicKey: vi.fn().mockImplementation(() => {
    return {
      toBase58: vi.fn(() => "1234567890"),
      toString: vi.fn(() => "1234567890"),
    };
  }),
  WalletAdapterNetwork: {
    Devnet: "devnet",
    Mainnet: "mainnet-beta",
  },
}));

// Mock wallet adapters
vi.mock("@solana/wallet-adapter-phantom", () => ({
  PhantomWalletAdapter: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    name: "Phantom",
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
  })),
}));
vi.mock("@solana/wallet-adapter-solflare", () => ({
  SolflareWalletAdapter: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    name: "Solflare",
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
  })),
}));
vi.mock("@solana/wallet-adapter-backpack", () => ({
  BackpackWalletAdapter: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    name: "Backpack",
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
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
  useWallet: vi.fn().mockImplementation(() => ({
    connected: true,
    publicKey: new PublicKey("1234567890"),
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
  })),
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
    <div data-auto-connect={autoConnect} data-wallets={wallets.length}>
      {children}
    </div>
  ),
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
