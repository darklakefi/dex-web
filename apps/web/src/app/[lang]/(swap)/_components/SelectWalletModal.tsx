"use client";

import { Box, Button, Modal } from "@dex-web/ui";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function SelectWalletModal() {
  const { wallets, select } = useWallet();
  const router = useRouter();
  const handleSelect = (
    wallet: Wallet,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    select(wallet.adapter.name);
  };

  const handleClose = () => {
    router.push("/");
  };

  return (
    <Modal onClose={handleClose}>
      <Box className="flex max-h-full w-full max-w-sm drop-shadow-xl">
        <div className="flex flex-col gap-4">
          {wallets.map((wallet) => (
            <Button
              className="cursor-pointer"
              key={wallet.adapter.name}
              onClick={(e) => handleSelect(wallet, e)}
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
