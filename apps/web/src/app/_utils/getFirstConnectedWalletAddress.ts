import type { Adapter } from "@solana/wallet-adapter-base";

export function getFirstConnectedWalletAddress(adapter: Adapter) {
  if ("standard" in adapter && adapter.standard) {
    return adapter.wallet.accounts[0]?.address ?? null;
  }

  return null;
}
