import type { PublicKey } from "@solana/web3.js";

export interface WalletSigningCapabilities {
  publicKey?: PublicKey | null;
  signTransaction?: (transaction: any) => Promise<any>;
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

export const hasSigningCapability = (signTransaction?: any): boolean => {
  return !!signTransaction;
};