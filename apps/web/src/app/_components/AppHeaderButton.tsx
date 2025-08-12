"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { ConnectedWalletButton } from "./ConnectedWalletButton";
import { ConnectWalletButton } from "./ConnectWalletButton";

export function AppHeaderButton() {
  const { wallets, wallet } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!wallet) {
    return <ConnectWalletButton wallets={wallets} />;
  }

  return <ConnectedWalletButton />;
}
