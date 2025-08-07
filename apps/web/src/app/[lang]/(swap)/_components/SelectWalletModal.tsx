"use client";

import { Box, Button, Icon, Modal, Text } from "@dex-web/ui";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { getFirstAvailableWallet } from "../../../_utils/getFirstAvailableWallet";
import { selectedTokensParsers } from "../_utils/searchParams";

export function SelectWalletModal() {
  const { wallets, wallet, select } = useWallet();
  const router = useRouter();
  const [shouldClose, setShouldClose] = useState(false);
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const firstAvailableWallet = getFirstAvailableWallet(wallets);

  useEffect(() => {
    if (firstAvailableWallet && shouldClose) {
      handleClose();
    }
  }, [firstAvailableWallet, shouldClose]);

  const handleSelect = (
    wallet: Wallet,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    select(wallet.adapter.name);
    setTimeout(() => {
      setShouldClose(true);
    }, 2000);
  };

  const handleClose = () => {
    router.push(
      `/?sellTokenAddress=${sellTokenAddress}&buyTokenAddress=${buyTokenAddress}&wallet=${wallet?.adapter.name}`,
    );
  };

  return (
    <Modal onClose={handleClose}>
      <Box className="fixed right-0 flex h-full max-h-full w-full max-w-sm drop-shadow-xl">
        <div className="mb-3 flex justify-between border-green-600 border-b pb-3">
          <Text className="font-bold text-2xl" variant="heading">
            Connect Wallet
          </Text>{" "}
          <button onClick={handleClose} type="button">
            <Icon className="size-6" name="times" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {wallets.map((wallet) => (
            <Button
              className="inline-flex cursor-pointer justify-start gap-4 bg-green-800 py-3"
              key={wallet.adapter.name}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleSelect(wallet, e)
              }
              type="button"
              variant="primary-dark"
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
