import type { UseTransactionToastsReturn } from "@dex-web/core";
import type { Wallet } from "@solana/wallet-adapter-react";
import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { requestTransactionSigning } from "../../../_utils/requestTransactionSigning";

interface RequestLiquidityTransactionSigningProps {
  publicKey: PublicKey;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
  setLiquidityStep: (step: number) => void;
  unsignedTransaction: string;
  tokenXMint: string;
  tokenYMint: string;
  onSuccess: () => void;
  onSubmitTransaction: (params: {
    signedTransaction: string;
    tokenXMint: string;
    tokenYMint: string;
    userAddress: string;
  }) => Promise<{ success: boolean; error?: string; signature?: string }>;
  trackingId: string;
  wallet: Wallet | null | undefined;
  toasts: UseTransactionToastsReturn;
}

export async function requestLiquidityTransactionSigning({
  publicKey,
  signTransaction,
  setLiquidityStep,
  unsignedTransaction,
  tokenXMint,
  tokenYMint,
  onSuccess,
  onSubmitTransaction,
  trackingId,
  wallet,
  toasts,
}: RequestLiquidityTransactionSigningProps): Promise<void> {
  return requestTransactionSigning({
    onSubmitTransaction,
    onSuccess,
    publicKey,
    setStep: setLiquidityStep,
    signTransaction,
    toasts,
    tokenXMint,
    tokenYMint,
    trackingId,
    transactionType: "addLiquidity",
    unsignedTransaction,
    userAddress: publicKey.toBase58(),
    wallet,
  });
}
