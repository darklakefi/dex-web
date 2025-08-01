"use client";
import { Button } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import Image from "next/image";

interface ConnectedWalletButtonProps {
  walletAdapter: {
    name: string;
    icon: string;
    address: string;
  };
}
export function ConnectedWalletButton({
  walletAdapter,
}: ConnectedWalletButtonProps) {
  return (
    <Button as="div" className="normal-case" variant="secondary">
      <Image
        alt={walletAdapter.name}
        height={18}
        src={walletAdapter.icon}
        width={18}
      />
      {truncate(walletAdapter.address)}
    </Button>
  );
}
