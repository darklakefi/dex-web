"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  CoinbaseWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
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
            new SolflareWalletAdapter(),
          ]
        : []),
    ],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
