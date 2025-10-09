import type { UseTransactionToastsReturn } from "@dex-web/core";
import type { Wallet } from "@solana/wallet-adapter-react";
import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { requestTransactionSigning } from "../../../_utils/requestTransactionSigning";

interface RequestCreatePoolTransactionSigningProps {
  publicKey: PublicKey;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
  setCreateStep: (step: number) => void;
  unsignedTransaction: string;
  tokenXMint: string;
  tokenYMint: string;
  onSuccess: () => void;
  showCreatePoolStepToast: (step: number) => void;
  trackingId: string;
  wallet?: Wallet | null | undefined;
  toasts?: UseTransactionToastsReturn;
}

export async function requestCreatePoolTransactionSigning({
  publicKey,
  signTransaction,
  setCreateStep,
  unsignedTransaction,
  tokenXMint,
  tokenYMint,
  onSuccess,
  showCreatePoolStepToast,
  trackingId,
  wallet,
  toasts,
}: RequestCreatePoolTransactionSigningProps): Promise<void> {
  const setStepWithToast = (step: number) => {
    setCreateStep(step);
    if (step > 1 && !toasts) {
      showCreatePoolStepToast(step);
    }
  };

  return requestTransactionSigning({
    onSuccess,
    publicKey,
    setStep: setStepWithToast,
    signTransaction,
    toasts,
    tokenXMint,
    tokenYMint,
    trackingId,
    transactionType: "createPool",
    unsignedTransaction,
    userAddress: publicKey.toBase58(),
    wallet,
  });
}
