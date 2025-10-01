"use client";

import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { VersionedTransaction } from "@solana/web3.js";
import { useCallback } from "react";
import { validateWalletForSigning } from "../utils/walletValidation";

export interface UseTransactionSigningParams {
  publicKey: WalletContextState["publicKey"];
  signTransaction: WalletContextState["signTransaction"];
}

export interface UseTransactionSigningReturn {
  signTransactionWithValidation: (
    transaction: VersionedTransaction,
  ) => Promise<VersionedTransaction>;
  isReadyToSign: boolean;
}

export const useTransactionSigning = ({
  publicKey,
  signTransaction,
}: UseTransactionSigningParams): UseTransactionSigningReturn => {
  const signTransactionWithValidation = useCallback(
    async (
      transaction: VersionedTransaction,
    ): Promise<VersionedTransaction> => {
      validateWalletForSigning({ publicKey, signTransaction });

      if (!signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      return await signTransaction(transaction);
    },
    [publicKey, signTransaction],
  );

  const isReadyToSign = Boolean(publicKey && signTransaction);

  return {
    isReadyToSign,
    signTransactionWithValidation,
  };
};
