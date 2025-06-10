"use client";

import { Box, Button, Text } from "@dex-web/ui";
import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { FC, MouseEvent } from "react";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { WalletListItem } from "./WalletListItem";
import { useWalletModal } from "./useWalletModal";

export interface WalletModalProps {
  className?: string;
  container?: string;
}

export const WalletModal: FC<WalletModalProps> = ({ container = "body" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    wallets,
    select,
    wallet: selectedWallet,
    connecting,
    connected,
  } = useWallet();
  const { setVisible } = useWalletModal();
  const [fadeIn, setFadeIn] = useState(false);
  const [portal, setPortal] = useState<Element | null>(null);

  const [installedWallets, notInstalledWallets] = useMemo(() => {
    const installed: Wallet[] = [];
    const notInstalled: Wallet[] = [];

    for (const wallet of wallets) {
      if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet);
      } else {
        notInstalled.push(wallet);
      }
    }

    return [installed, notInstalled];
  }, [wallets]);

  const hideModal = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => setVisible(false), 150);
  }, [setVisible]);

  const handleClose = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      hideModal();
    },
    [hideModal],
  );

  const handleWalletClick = useCallback(
    (event: MouseEvent, walletName: WalletName) => {
      select(walletName);
      // handleClose(event);
    },
    [select],
  );

  useEffect(() => {
    if (selectedWallet && connected) {
      hideModal();
    }
  }, [selectedWallet, connected, hideModal]);

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideModal();
      }
    };

    // Get original overflow
    const { overflow } = window.getComputedStyle(document.body);
    // Hack to enable fade in animation after mount
    setTimeout(() => setFadeIn(true), 0);
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Listen for keydown events
    window.addEventListener("keydown", handleKeyDown, false);

    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown, false);
    };
  }, [hideModal]);

  useLayoutEffect(
    () => setPortal(document.querySelector(container)),
    [container],
  );

  useEffect(() => {
    if (fadeIn && ref.current) {
      ref.current.focus();
    }
  }, [fadeIn]);

  return (
    portal &&
    createPortal(
      <div
        className={twMerge(
          "fixed top-0 right-0 flex h-screen w-110 items-center justify-center bg-transparent p-5 transition-opacity duration-150",
          fadeIn ? "opacity-100" : "opacity-0",
        )}
        ref={ref}
        tabIndex={-1}
      >
        <Box
          shadow="xl"
          className={twMerge(
            "z-10 h-full w-full flex-col gap-4 shadow-green-600 transition-transform duration-150",
            fadeIn ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex w-full justify-between border-green-600 border-b">
            <Text.Heading>connect wallet</Text.Heading>
            <Button.Tertiary icon="times" onClick={handleClose} />
          </div>
          <div className="flex w-full flex-col gap-4">
            {installedWallets.map((wallet) => (
              <WalletListItem
                key={wallet.adapter.name}
                handleClick={(event) =>
                  handleWalletClick(event, wallet.adapter.name)
                }
                wallet={wallet}
                connecting={
                  selectedWallet?.adapter.name === wallet.adapter.name &&
                  connecting
                }
              />
            ))}
            {notInstalledWallets.map((wallet) => (
              <WalletListItem
                key={wallet.adapter.name}
                handleClick={(event) =>
                  handleWalletClick(event, wallet.adapter.name)
                }
                wallet={wallet}
              />
            ))}
          </div>
        </Box>
        <div className="fixed inset-0 bg-green-900 opacity-90" />
      </div>,
      portal,
    )
  );
};
