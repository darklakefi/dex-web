"use client";
import { Box, Button, Icon } from "@dex-web/ui";
import { truncate } from "@dex-web/utils";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  useInvalidateWalletCache,
  useWalletAdapter,
  useWalletAddress,
} from "../../hooks/useWalletCache";
import { SkeletonWalletButton } from "./SkeletonWalletButton";

export interface WalletButtonProps
  extends React.ComponentProps<typeof Button> {}

export function WalletButton({
  suppressHydrationWarning = true,
  ...props
}: WalletButtonProps) {
  const router = useRouter();
  const { disconnect, wallet, connected, publicKey } = useWallet();
  const { invalidateAll } = useInvalidateWalletCache();
  const {
    data: adapter,
    isLoading: adapterLoading,
    isPlaceholderData: adapterIsPlaceholder,
  } = useWalletAdapter();
  const {
    data: address,
    isLoading: addressLoading,
    isPlaceholderData: addressIsPlaceholder,
  } = useWalletAddress();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  function handleClick() {
    router.push("/select-wallet");
  }

  const isWalletDisconnected = !wallet || !connected;
  const displayAddress = address || publicKey?.toString() || "";
  const hasValidAddress = displayAddress.length > 0;

  if (
    !isHydrated ||
    (!isWalletDisconnected &&
      (adapterLoading ||
        addressLoading ||
        adapterIsPlaceholder ||
        addressIsPlaceholder ||
        !hasValidAddress))
  ) {
    return (
      <SkeletonWalletButton
        className={twMerge("h-10 w-32", props.className)}
        suppressHydrationWarning={suppressHydrationWarning}
      />
    );
  }

  if (!wallet || !connected) {
    return (
      <Button
        className={twMerge(props.className, "cursor-pointer leading-6")}
        onClick={handleClick}
        variant="primary"
      >
        Connect Wallet
      </Button>
    );
  }

  const currentWalletAdapter = adapter?.adapter;

  return (
    <Popover className="">
      {({ open }) => (
        <>
          <PopoverButton
            className={twMerge(
              "cursor-pointer normal-case leading-6",
              open ? "opacity-70" : "opacity-100",
            )}
          >
            <Button
              as="span"
              className="cursor-pointer normal-case leading-6"
              variant="secondary"
            >
              <Image
                alt={currentWalletAdapter?.name ?? ""}
                height={18}
                src={currentWalletAdapter?.icon ?? ""}
                width={18}
              />
              {truncate(displayAddress)}
            </Button>
          </PopoverButton>
          <PopoverPanel anchor="bottom end" className="z-30 mt-4">
            {({ close }) => (
              <Box className="bg-green-600" padding="sm" shadow="sm">
                <Link
                  className="inline-flex min-w-48 cursor-pointer items-center gap-2 px-1 uppercase"
                  href="/referrals"
                >
                  <Icon className="size-4" name="share" />
                  Referrals
                </Link>
                <hr className="border-green-500 px-1" />
                <button
                  className="inline-flex min-w-48 cursor-pointer items-center gap-2 px-1 uppercase"
                  onClick={() => {
                    close();
                    disconnect();
                    invalidateAll();
                  }}
                  type="button"
                >
                  <Icon className="size-4" name="logout" />
                  Disconnect
                </button>
              </Box>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
