"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "./useWalletModal";

import {
  Button,
  Icon,
  type IconName,
  Text,
  type VariantButtonProps,
} from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import type { FC, MouseEvent } from "react";
import { useCallback, useMemo } from "react";

export const WalletConnectButton: FC<VariantButtonProps> = ({
  onClick,
  ...props
}) => {
  const { visible, setVisible } = useWalletModal();

  const {
    connected,
    publicKey,
    connecting,
    disconnecting,
    disconnect,
    wallet,
  } = useWallet();

  const buttonText = useMemo(() => {
    if (connecting) return "Connecting...";
    if (disconnecting) return "Disconnecting...";
    if (connected) return truncate(publicKey?.toBase58() || "");
    return "Connect Wallet";
  }, [connecting, disconnecting, connected, publicKey]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) setVisible(!visible);
    },
    [onClick, setVisible, visible],
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const walletIcon = useMemo(() => {
    return wallet?.adapter.name.toLowerCase();
  }, [wallet]);

  return connected ? (
    <Button.Secondary
      {...props}
      onClick={handleDisconnect}
      className="flex gap-2"
    >
      <Icon name={walletIcon as IconName} className="size-6 text-inherit" />
      <Text.Body2 className="text-inherit" textCase="normal-case">
        {buttonText}
      </Text.Body2>
    </Button.Secondary>
  ) : (
    <Button.Primary {...props} onClick={handleClick}>
      <Text.Body2 className="text-inherit">{buttonText}</Text.Body2>
    </Button.Primary>
  );
};
