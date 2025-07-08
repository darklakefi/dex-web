import { WalletReadyState } from "@solana/wallet-adapter-base";
import type { Wallet } from "@solana/wallet-adapter-react";

export function getFirstConnectedWalletAdapter(wallets: Wallet[]) {
  return wallets.find(
    (wallet) => wallet.readyState === WalletReadyState.Installed,
  )?.adapter;
}
