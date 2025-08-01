"use client";
import { Box, Button } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { isObject } from "effect/Predicate";
import { isNonEmpty } from "effect/String";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getFirstConnectedWalletAddress } from "../_utils/getFirstConnectedWalletAddress";

export function ConnectedWalletButton() {
  const { wallet, disconnect } = useWallet();
  const [selectedWalletAdapter, setSelectedWalletAdapter] =
    useState<WalletAdapter | null>(null);

  useEffect(() => {
    const checkWallet = () => {
      const currentWalletAddress = wallet
        ? getFirstConnectedWalletAddress(wallet.adapter)
        : null;
      return currentWalletAddress && isNonEmpty(currentWalletAddress);
    };

    const interval = setInterval(() => {
      if (wallet && checkWallet()) {
        setSelectedWalletAdapter(wallet.adapter);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [wallet]);

  if (!isObject(selectedWalletAdapter)) {
    return (
      <Button
        as="div"
        className="cursor-pointer normal-case"
        variant="secondary"
      >
        Loading...
      </Button>
    );
  }

  return (
    <Popover className="">
      {({ open }) => (
        <>
          <PopoverButton
            as="div"
            className={open ? "opacity-70" : "opacity-100"}
          >
            <Button
              as="div"
              className="cursor-pointer normal-case"
              variant="secondary"
            >
              <Image
                alt={selectedWalletAdapter.name}
                height={18}
                src={selectedWalletAdapter.icon}
                width={18}
              />
              {truncate(
                getFirstConnectedWalletAddress(selectedWalletAdapter) ?? "",
              )}
            </Button>
          </PopoverButton>
          <PopoverPanel anchor="bottom" className="z-30 mt-1">
            {({ close }) => (
              <Box className="bg-green-600" padding="sm" shadow="sm">
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    close();
                    disconnect();
                  }}
                  text="disconnect"
                  variant="primary"
                />
              </Box>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
