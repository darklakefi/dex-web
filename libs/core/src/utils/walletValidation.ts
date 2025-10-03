import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export interface WalletSigningCapabilities {
  publicKey?: PublicKey | null;
  signTransaction?:
    | (<T extends VersionedTransaction | Transaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
}

export const validateWalletForSigning = ({
  publicKey,
  signTransaction,
}: WalletSigningCapabilities): void => {
  if (!publicKey) {
    throw new Error("Wallet not connected!");
  }

  if (!signTransaction) {
    throw new Error("Wallet does not support transaction signing!");
  }
};

export const isWalletConnected = (publicKey?: PublicKey | null): boolean => {
  return !!publicKey;
};

export const hasSigningCapability = (signTransaction?: unknown): boolean => {
  return !!signTransaction;
};
