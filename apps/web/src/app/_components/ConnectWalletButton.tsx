"use client";

import { Button } from "@dex-web/ui";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import { twMerge } from "tailwind-merge";
import { getFirstAvailableWallet } from "../_utils/getFirstAvailableWallet";

interface ConnectWalletButtonProps {
  wallets: Wallet[];
  className?: string;
}
export function ConnectWalletButton({
  wallets,
  className,
}: ConnectWalletButtonProps) {
  const { select } = useWallet();
  const firstAvailableWallet = getFirstAvailableWallet(wallets);
  function handleClick() {
    if (firstAvailableWallet) {
      select(firstAvailableWallet.adapter.name);
    }
    throw new Error("No wallet available");
  }

  return (
    <Button
      className={twMerge(className, "cursor-pointer")}
      onClick={handleClick}
      variant="primary"
    >
      Connect Wallet
    </Button>
  );
}
