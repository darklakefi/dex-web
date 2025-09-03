"use client";

import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useAnalytics } from "../../hooks/useAnalytics";
import { selectedTokensParsers } from "../_utils/searchParams";

export function SelectWalletModal() {
  const { wallets, wallet, select, publicKey } = useWallet();
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

      // Wait for wallet to connect and get the public key
      setTimeout(() => {
        // Track wallet connection after wallet is actually connected
        trackWalletConnection({
          address: publicKey?.toBase58(),
          success: true,
          wallet: wallet.adapter.name,
        });
        handleClose();
      }, 2000);
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
          {wallets.map((wallet) => (
            <Button
              className="inline-flex cursor-pointer justify-start gap-4"
              key={wallet.adapter.name}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleSelect(wallet, e)
              }
              type="button"
              variant="secondary"
            >
              <Image
                alt={wallet.adapter.name}
                height={24}
                src={wallet.adapter.icon}
                width={24}
              />
              {wallet.adapter.name}
            </Button>
          ))}
        </div>
      </Box>
    </Modal>
  );
}
