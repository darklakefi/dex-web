"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { type FC, type ReactNode, useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";
import { getSolanaWalletAdapterNetwork } from "../_utils/getSolanaWalletAdapterNetwork";

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  const network = getSolanaWalletAdapterNetwork();
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      ...(typeof window !== "undefined"
        ? [
            new PhantomWalletAdapter(),
            new CoinbaseWalletAdapter(),
            new TrustWalletAdapter(),
          ]
        : []),
    ],
    [],
  );

  const onError = useMemo(
    () => (error: Error) => {
      // Suppress expected auto-connect errors when no wallet is available
      if (
        error.name === "WalletConnectionError" &&
        error.message.includes("Unexpected error")
      ) {
        // This is expected when auto-connecting without a wallet installed/connected
        return;
      }
      // Log other wallet errors
      console.error("Wallet error:", error);
    },
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect onError={onError} wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
