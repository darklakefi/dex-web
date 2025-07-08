"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { getFirstConnectedWalletAdapter } from "../_utils/getFirstConnectedWalletAdapter";
import { getFirstConnectedWalletAddress } from "../_utils/getFirstConnectedWalletAddress";
import { ConnectedWalletButton } from "./ConnectedWalletButton";
import { ConnectWalletButton } from "./ConnectWalletButton";

export function AppHeaderButton() {
  const { wallets } = useWallet();
  const firstConnectedWalletAdapter = getFirstConnectedWalletAdapter(wallets);

  const firstConnectedWalletAddress = firstConnectedWalletAdapter
    ? getFirstConnectedWalletAddress(firstConnectedWalletAdapter)
    : null;

  if (!firstConnectedWalletAddress || !firstConnectedWalletAdapter) {
    return <ConnectWalletButton wallets={wallets} />;
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
