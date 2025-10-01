import { AnchorProvider, type web3 } from "@coral-xyz/anchor";
import { PublicKey, type VersionedTransaction } from "@solana/web3.js";
import { getHeliusConnection } from "./getHeliusConnection";

export function createWalletAdapter(userAddress: string) {
  return {
    publicKey: new PublicKey(userAddress),
    signAllTransactions: async <
      T extends web3.Transaction | VersionedTransaction,
    >(
      txs: T[],
    ): Promise<T[]> => txs,
    signTransaction: async <T extends web3.Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> => tx,
  };
}

export function createAnchorProvider(userAddress: string) {
  const connection = getHeliusConnection();

  const wallet = createWalletAdapter(userAddress);

  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}
