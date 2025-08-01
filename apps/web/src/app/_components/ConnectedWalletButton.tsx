"use client";
import { Box, Button } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
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
  const { disconnect } = useWallet();

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
                alt={walletAdapter.name}
                height={18}
                src={walletAdapter.icon}
                width={18}
              />
              {truncate(walletAdapter.address)}
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
