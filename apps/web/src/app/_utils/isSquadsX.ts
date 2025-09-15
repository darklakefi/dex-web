import type { Wallet } from "@solana/wallet-adapter-react";

export function isSquadsX(wallet: Wallet | null | undefined): boolean {
  return wallet?.adapter?.name === "SquadsX";
}
