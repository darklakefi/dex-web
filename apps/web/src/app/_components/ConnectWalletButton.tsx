"use client";

import { Button } from "@dex-web/ui";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

interface ConnectWalletButtonProps {
  wallets: Wallet[];
  className?: string;
}
export function ConnectWalletButton({
  wallets,
  className,
}: ConnectWalletButtonProps) {
  const router = useRouter();
  function handleClick() {
    router.push("/select-wallet");
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
