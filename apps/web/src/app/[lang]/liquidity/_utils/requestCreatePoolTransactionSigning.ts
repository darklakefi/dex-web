import {
  getUserFriendlyErrorMessage,
  isWarningMessage,
  signTransactionWithRecovery,
} from "@dex-web/core";
import { client } from "@dex-web/orpc";
import {
  type PublicKey,
  type Transaction,
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
  checkTransactionStatus: (signature: string) => Promise<void>;
  showCreatePoolStepToast: (step: number) => void;
}
export async function requestCreatePoolTransactionSigning({
  publicKey,
  signTransaction,
  setCreateStep,
  unsignedTransaction,
  checkTransactionStatus,
  showCreatePoolStepToast,
}: RequestCreatePoolTransactionSigningProps) {
  try {
    if (!publicKey) throw new Error("Wallet not connected!");
    if (!signTransaction)
      throw new Error("Wallet does not support transaction signing!");

    setCreateStep(2);
    showCreatePoolStepToast(2);

    const unsignedTransactionBuffer = Buffer.from(
      unsignedTransaction,
      "base64",
    );
    const transaction = VersionedTransaction.deserialize(
      unsignedTransactionBuffer,
    );

    const signedTransaction = await signTransactionWithRecovery(
      transaction,
      signTransaction,
    );
    const signedTransactionBase64 = Buffer.from(
      signedTransaction.serialize(),
    ).toString("base64");

    const signedTxRequest = {
      signed_transaction: signedTransactionBase64,
    };

    setCreateStep(3);
    showCreatePoolStepToast(3);

    const createTxResponse =
      await client.liquidity.submitLiquidityTransaction(signedTxRequest);

    if (createTxResponse.success && createTxResponse.signature) {
      checkTransactionStatus(createTxResponse.signature);
    } else {
      const errorMessage =
        createTxResponse.error_logs || "Unknown error occurred";
      console.error("Create pool transaction submission failed:", {
        error_logs: createTxResponse.error_logs,
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
