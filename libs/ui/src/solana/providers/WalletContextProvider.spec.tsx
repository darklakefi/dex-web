/// <reference types="@vitest/browser/context" />
import "@testing-library/jest-dom";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create a mock of the WalletAdapterNetwork type
vi.mock("@solana/wallet-adapter-base", () => ({
  // Just need to mock what we use
}));

// Define the WalletAdapterNetwork type directly in our test
type MockWalletAdapterNetwork =
  | "mainnet-beta"
  | "testnet"
  | "devnet"
  | "localnet";

// Mock the Solana dependencies
vi.mock("@solana/wallet-adapter-backpack", () => ({
  BackpackWalletAdapter: class MockBackpackWalletAdapter {
    name = "Backpack";
  },
}));

vi.mock("@solana/wallet-adapter-phantom", () => ({
  PhantomWalletAdapter: class MockPhantomWalletAdapter {
    name = "Phantom";
  },
}));

vi.mock("@solana/wallet-adapter-solflare", () => ({
  SolflareWalletAdapter: class MockSolflareWalletAdapter {
    name = "Solflare";
  },
}));

vi.mock("@solana/web3.js", () => ({
  clusterApiUrl: vi.fn().mockReturnValue("https://api.devnet.solana.com"),
}));

// Mock with access to error callback for testing
let storedErrorCallback:
  | ((error: Error, adapter?: unknown) => void)
  | undefined;

// Mock the ConnectionProvider and WalletProvider
vi.mock("@solana/wallet-adapter-react", () => ({
  ConnectionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-connection-provider">{children}</div>
  ),
  WalletProvider: ({
    children,
    wallets,
    autoConnect,
    onError,
  }: {
    children: React.ReactNode;
    wallets: unknown[];
    autoConnect: boolean;
    onError?: (error: Error, adapter?: unknown) => void;
  }) => {
    // Store the error callback for testing
    storedErrorCallback = onError;

    return (
      <div
        data-auto-connect={autoConnect ? "true" : "false"}
        data-has-error-handler={onError !== undefined ? "true" : "false"}
        data-testid="mock-wallet-provider"
        data-wallets={wallets.length}
      >
        {children}
      </div>
    );
  },
}));

import { WalletContextProvider } from "./WalletContextProvider";

describe("WalletContextProvider", () => {
  const mockNetwork: MockWalletAdapterNetwork = "devnet";
  const mockOnError = vi.fn();
  const mockAdapter = { name: "MockAdapter" };
  const mockError = new Error("Wallet connection error");

  beforeEach(() => {
    vi.clearAllMocks();
    storedErrorCallback = undefined;
  });

  it("should render successfully with children", () => {
    const { baseElement, getByTestId } = render(
      <WalletContextProvider network={mockNetwork as any}>
        <div data-testid="test-child">Child Component</div>
      </WalletContextProvider>,
    );

    expect(baseElement).toBeTruthy();
    expect(getByTestId("mock-connection-provider")).toBeInTheDocument();
    expect(getByTestId("mock-wallet-provider")).toBeInTheDocument();
    expect(getByTestId("test-child")).toBeInTheDocument();
  });

  it("should pass correct props to ConnectionProvider and WalletProvider", () => {
    const { getByTestId } = render(
      <WalletContextProvider network={mockNetwork as any}>
        <div>Child Component</div>
      </WalletContextProvider>,
    );

    const walletProvider = getByTestId("mock-wallet-provider");
    expect(walletProvider).toHaveAttribute("data-wallets", "3"); // The three wallet adapters
    expect(walletProvider).toHaveAttribute("data-auto-connect", "true");
  });

  it("should call onError when error handler is triggered", () => {
    const { getByTestId } = render(
      <WalletContextProvider network={mockNetwork as any} onError={mockOnError}>
        <div>Child Component</div>
      </WalletContextProvider>,
    );

    const walletProvider = getByTestId("mock-wallet-provider");
    expect(walletProvider).toHaveAttribute("data-has-error-handler", "true");
  });

  it("should forward errors to the provided onError handler", () => {
    render(
      <WalletContextProvider network={mockNetwork as any} onError={mockOnError}>
        <div>Child Component</div>
      </WalletContextProvider>,
    );

    // Check that we have captured the error callback
    expect(storedErrorCallback).toBeDefined();

    // Simulate a wallet error
    act(() => {
      // Using the non-null assertion operator since we've confirmed it's defined in the test
      storedErrorCallback!(mockError, mockAdapter);
    });

    // Verify that our error handler was called with the correct arguments
    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(mockError, mockAdapter);
  });
});
