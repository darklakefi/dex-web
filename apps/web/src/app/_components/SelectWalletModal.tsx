"use client";

import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useAnalytics } from "../../hooks/useAnalytics";
import { selectedTokensParsers } from "../_utils/searchParams";
import { twMerge } from "tailwind-merge";
import { useEffect } from "react";

export function SelectWalletModal() {
  const { wallets, wallet, select, publicKey, connecting, connected } = useWallet();
  const router = useRouter();
  const { trackWalletConnection } = useAnalytics();
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

	const handleSelect = async (
		wallet: Wallet,
		e: React.MouseEvent<HTMLButtonElement>,
	) => {
		e.preventDefault();

    try {
      select(wallet.adapter.name);
    } catch (error) {
      // Track wallet connection failure
      trackWalletConnection({
        success: false,
        wallet: wallet.adapter.name,
      });
      throw error;
    }
  };

	const handleClose = () => {
		router.push(
			`/?tokenAAddress=${tokenAAddress}&tokenBAddress=${tokenBAddress}&wallet=${wallet?.adapter.name}`,
		);
	};

  useEffect(() => {
    if (connected && wallet && publicKey) {
      trackWalletConnection({
        address: publicKey.toBase58(),
        success: true,
        wallet: wallet.adapter.name,
      });
      handleClose();
    }
  }, [connected, wallet, publicKey]);

  return (
    <Modal onClose={handleClose}>
      <Box className="fixed right-0 flex h-full max-h-full w-full max-w-sm drop-shadow-xl">
        <div className="mb-3 flex justify-between border-green-600 border-b pb-3">
          <Text className="font-bold text-2xl" variant="heading">
            Connect Wallet
          </Text>{" "}
          <button
            className="cursor-pointer"
            onClick={handleClose}
            type="button"
          >
            <Icon className="size-6" name="times" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {wallets.map((installedWallet) => {
            const isConnecting = connecting && installedWallet.adapter.name === wallet?.adapter.name;
            return (
              <Button
                className="inline-flex cursor-pointer justify-start gap-4"
                key={installedWallet.adapter.name}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  handleSelect(installedWallet, e)
                }
                type="button"
                variant="secondary"
                disabled={isConnecting}
              >
                <div className="flex justify-between w-full items-center">
                  <div className="flex items-center gap-2">
                    <Image
                      alt={installedWallet.adapter.name}
                      height={24}
                      src={installedWallet.adapter.icon}
                      width={24}
                    />
                    {installedWallet.adapter.name}
                  </div>
                  <Icon
                    className={twMerge("size-4 animate-spin-pause text-inherit", isConnecting ? "block" : "hidden")}
                    name="loading-stripe"
                  />
                </div>
              </Button>
            )
          })}
        </div>
      </Box>
    </Modal>
  );
}
