"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectedWalletButton } from "./ConnectedWalletButton";
import { ConnectWalletButton } from "./ConnectWalletButton";

export function AppHeaderButton() {
  const { wallet } = useWallet();

  if (!wallet) {
    return <ConnectWalletButton />;
  }

  return <ConnectedWalletButton />;
}
