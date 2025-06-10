"use client";

import {
  Box,
  Button,
  Icon,
  type IconName,
  Text,
  type VariantButtonProps,
} from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { FC, MouseEvent } from "react";
import { useCallback, useMemo } from "react";
import { useWalletModal } from "./useWalletModal";

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
    <Popover className="">
      {({ open }) => (
        <>
          <PopoverButton
            as="div"
            className={open ? "opacity-70" : "opacity-100"}
          >
            <Button.Secondary {...props} className="flex gap-2">
              <Icon
                className="size-6 text-inherit"
                name={walletIcon as IconName}
              />
              <Text.Body2 className="text-inherit" textCase="normal-case">
                {buttonText}
              </Text.Body2>
            </Button.Secondary>
          </PopoverButton>
          <PopoverPanel anchor="bottom" className="z-30 mt-2">
            {({ close }) => (
              <Box className="bg-green-600" padding="sm" shadow="sm">
                <Button.Primary
                  onClick={() => {
                    close();
                    handleDisconnect();
                  }}
                  text="disconnect"
                />
              </Box>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  ) : (
    <Button.Primary {...props} onClick={handleClick}>
      <Text.Body2 className="text-inherit">{buttonText}</Text.Body2>
    </Button.Primary>
  );
};
