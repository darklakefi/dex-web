import {
  getUserFriendlyErrorMessage,
  isWarningMessage,
  signTransactionWithRecovery,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import { deserializeVersionedTransaction } from "@dex-web/orpc/utils/solana";
import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { dismissToast, toast } from "../../../_utils/toast";

interface RequestCreatePoolTransactionSigningProps {
  publicKey: PublicKey;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
  setCreateStep: (step: number) => void;
  unsignedTransaction: string;
  trackingId: string;
  checkTransactionStatus: (
    tradeId: string,
    trackingId: string,
  ) => Promise<void>;
  showCreatePoolStepToast: (step: number) => void;
}
export async function requestCreatePoolTransactionSigning({
  publicKey,
  signTransaction,
  setCreateStep,
  unsignedTransaction,
  trackingId,
  checkTransactionStatus,
  showCreatePoolStepToast,
}: RequestCreatePoolTransactionSigningProps) {
  try {
    if (!publicKey) throw new Error("Wallet not connected!");
    if (!signTransaction)
      throw new Error("Wallet does not support transaction signing!");

    setCreateStep(2);
    showCreatePoolStepToast(2);

    const transaction = deserializeVersionedTransaction(unsignedTransaction);

    const signedTransaction = await signTransactionWithRecovery(
      transaction,
      signTransaction,
    );
    const signedTransactionBase64 = Buffer.from(
      signedTransaction.serialize(),
    ).toString("base64");

    const signature = signedTransaction.signatures[0];
    if (!signature) {
      throw new Error("Transaction signature is missing");
    }
    const tradeId = Buffer.from(signature).toString("base64");

    setCreateStep(3);
    showCreatePoolStepToast(3);

    const createTxResponse = await client.dexGateway.submitSignedTransaction({
      signedTransaction: signedTransactionBase64,
      trackingId,
      tradeId,
    });

    if (createTxResponse.success) {
      checkTransactionStatus(tradeId, trackingId);
    } else {
      const errorLogs = createTxResponse.errorLogs;
      const errorMessage = Array.isArray(errorLogs)
        ? errorLogs.join(", ")
        : typeof errorLogs === "string"
          ? errorLogs
          : "Unknown error occurred";
      console.error("Create pool transaction submission failed:", {
        errorLogs: createTxResponse.errorLogs,
        success: createTxResponse.success,
      });
      throw new Error(`Create pool transaction failed: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Signing error:", error);
    dismissToast();

    const userMessage = getUserFriendlyErrorMessage(error);
    const isWarning = isWarningMessage(error);

    toast({
      description: userMessage,
      title: isWarning ? "Transaction Warning" : "Signing Error",
      variant: isWarning ? "warning" : "error",
    });
    setCreateStep(0);
  }
}
