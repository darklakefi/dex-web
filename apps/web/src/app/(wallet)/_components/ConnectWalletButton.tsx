"use client";

import { Button, Icon, type IconName, Text } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const ConnectWalletButton = ({ ...props }) => {
  const { connected, publicKey, wallet } = useWallet();
  const pathname = usePathname();
  const connectWalletPath = `${pathname === "/" ? "" : pathname}/connect-wallet`;

  const buttonText = connected
    ? truncate(publicKey?.toBase58() || "")
    : "Connect Wallet";

  const walletIcon = wallet?.adapter.name.toLowerCase() as IconName;

  return connected ? (
    <Button variant="secondary" {...props} className="flex gap-2">
      <Icon className="size-6 text-inherit" name={walletIcon} />
      <Text.Body2 className="text-inherit normal-case">{buttonText}</Text.Body2>
    </Button>
  ) : (
    <Button as={Link} href={connectWalletPath} variant="primary" {...props}>
      <Text.Body2 className="text-inherit">{buttonText}</Text.Body2>
    </Button>
  );
};
