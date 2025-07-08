"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { getFirstConnectedWalletAdapter } from "../_utils/getFirstConnectedWalletAdapter";
import { getFirstConnectedWalletAddress } from "../_utils/getFirstConnectedWalletAddress";
import { ConnectedWalletButton } from "./ConnectedWalletButton";
import { ConnectWalletButton } from "./ConnectWalletButton";

export function AppHeaderButton() {
  const { wallets } = useWallet();
  const firstConnectedWalletAdapter = getFirstConnectedWalletAdapter(wallets);

  if (!firstConnectedWalletAdapter) {
    return <ConnectWalletButton wallets={wallets} />;
  }
  const firstConnectedWalletAddress = getFirstConnectedWalletAddress(
    firstConnectedWalletAdapter,
  );

  if (!firstConnectedWalletAddress) {
    throw new Error(
      `No wallet address found for ${firstConnectedWalletAdapter.name}`,
    );
  }

  return (
    <ConnectedWalletButton
      walletAdapter={{
        address: firstConnectedWalletAddress,
        icon: firstConnectedWalletAdapter.icon,
        name: firstConnectedWalletAdapter.name,
      }}
    />
  );
}
