"use client";

import { Button } from "@dex-web/ui";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";

interface ConnectWalletButtonProps {
  className?: string;
}
export function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const router = useRouter();
  function handleClick() {
    router.push("/select-wallet");
  }

  return (
    <Button
      className={twMerge(className, "cursor-pointer leading-6")}
      onClick={handleClick}
      variant="primary"
    >
      Connect Wallet
    </Button>
  );
}
