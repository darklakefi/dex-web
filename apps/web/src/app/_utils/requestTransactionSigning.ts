import {
  getUserFriendlyErrorMessage,
  isWarningMessage,
  signTransactionWithRecovery,
  type UseTransactionToastsReturn,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import { deserializeVersionedTransaction } from "@dex-web/orpc/utils/solana";
import type { Wallet } from "@solana/wallet-adapter-react";
import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export type TransactionType = "addLiquidity" | "createPool";

interface RequestTransactionSigningParams {
  publicKey: PublicKey;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
  unsignedTransaction: string;
  tokenXMint: string;
  tokenYMint: string;
  userAddress: string;
  onSuccess: () => void;
  transactionType: TransactionType;
  setStep?: (step: number) => void;
  trackingId?: string;
  wallet?: Wallet | null | undefined;
  toasts?: UseTransactionToastsReturn;
}

export async function requestTransactionSigning({
  publicKey,
  signTransaction,
  unsignedTransaction,
  tokenXMint,
  tokenYMint,
  userAddress,
  onSuccess,
  transactionType: _transactionType,
  setStep,
  trackingId: _trackingId,
  wallet: _wallet,
  toasts,
}: RequestTransactionSigningParams): Promise<void> {
  try {
    if (!publicKey) throw new Error("Wallet not connected!");
    if (!signTransaction)
      throw new Error("Wallet does not support transaction signing!");

    setStep?.(2);
    if (toasts) {
      toasts.showStepToast(2);
    }

    const transaction = deserializeVersionedTransaction(unsignedTransaction);
    const signedTransaction = await signTransactionWithRecovery(
      transaction,
      signTransaction,
    );
    const signedTransactionBase64 = Buffer.from(
      signedTransaction.serialize(),
    ).toString("base64");

    setStep?.(3);
    if (toasts) {
      toasts.showStepToast(3);
    }

    const response = await client.liquidity.submitAddLiquidity({
      signedTransaction: signedTransactionBase64,
      tokenXMint,
      tokenYMint,
      userAddress,
    });

    if (response.success) {
      onSuccess();
    } else {
      const errorMessage = response.error || "Unknown error occurred";
      console.error("Transaction submission failed:", {
        error: response.error,
        signature: response.signature,
        success: response.success,
      });
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Transaction signing error:", error);

    const userMessage = getUserFriendlyErrorMessage(error);
    const isWarning = isWarningMessage(error);

    if (toasts) {
      if (isWarning) {
        toasts.showWarningToast(userMessage);
      } else {
        toasts.showErrorToast(userMessage);
      }
    }

    setStep?.(0);
    throw error;
  }
}
