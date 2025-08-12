"use client";
import { Box, Button } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { getFirstConnectedWalletAddress } from "../_utils/getFirstConnectedWalletAddress";

export function ConnectedWalletButton() {
  const { wallet, disconnect } = useWallet();

  if (!wallet || !wallet.adapter) {
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

  const currentWalletAdapter = wallet.adapter;

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
                alt={currentWalletAdapter.name}
                height={18}
                src={currentWalletAdapter.icon}
                width={18}
              />
              {truncate(
                getFirstConnectedWalletAddress(currentWalletAdapter) ?? "",
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
