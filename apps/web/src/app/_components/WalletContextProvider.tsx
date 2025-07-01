"use client";

import type {
  Adapter,
  WalletAdapterNetwork,
  WalletError,
} from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import type { FC, ReactNode } from "react";

const WALLET_ADAPTERS = [
  /**
   * Wallets that implement either of these standards will be available automatically.
   *
   *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
   *     (https://github.com/solana-mobile/mobile-wallet-adapter)
   *   - Solana Wallet Standard
   *     (https://github.com/solana-labs/wallet-standard)
   *
   * If you wish to support a wallet that supports neither of those standards,
   * instantiate its legacy wallet adapter here. Common legacy adapters can be found
   * in the npm package `@solana/wallet-adapter-wallets`.
   */
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
];

export interface WalletContextProviderProps {
  children: ReactNode;
  network: WalletAdapterNetwork;
  onError?: (error: WalletError, adapter?: Adapter) => void;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
  network,
  onError,
}) => {
  const endpoint = clusterApiUrl(network);
  const handleError = (error: WalletError, adapter?: Adapter) => {
    onError?.(error, adapter);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        autoConnect={true}
        onError={handleError}
        wallets={WALLET_ADAPTERS}
      >
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
