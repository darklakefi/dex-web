"use client";

import { Button } from "@dex-web/ui";
import type { Wallet } from "@solana/wallet-adapter-react";
import { getFirstAvailableWallet } from "../_utils/getFirstAvailableWallet";

interface ConnectWalletButtonProps {
  wallets: Wallet[];
}
export function ConnectWalletButton({ wallets }: ConnectWalletButtonProps) {
  const firstAvailableWallet = getFirstAvailableWallet(wallets);
  function handleClick() {
    if (firstAvailableWallet) {
      firstAvailableWallet.adapter.connect();
    }
    throw new Error("No wallet available");
  }

  return (
    <Button onClick={handleClick} variant="primary">
      Connect Wallet
    </Button>
  );
}
