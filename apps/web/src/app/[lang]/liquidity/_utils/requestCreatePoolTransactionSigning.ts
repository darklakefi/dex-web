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
  tokenXMint: string;
  tokenYMint: string;
  onSuccess: () => void;
  showCreatePoolStepToast: (step: number) => void;
  trackingId: string;
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
  trackingId: _trackingId,
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

    setCreateStep(3);
    showCreatePoolStepToast(3);

    const createTxResponse = await client.liquidity.submitAddLiquidity({
      signedTransaction: signedTransactionBase64,
      tokenXMint,
      tokenYMint,
      userAddress: publicKey.toBase58(),
    });

    if (createTxResponse.success) {
      dismissToast();
      toast({
        description: "Pool created successfully!",
        title: "Success",
        variant: "success",
      });
      onSuccess();
    } else {
      const errorMessage = createTxResponse.error || "Unknown error occurred";
      console.error("Create pool transaction submission failed:", {
        error: createTxResponse.error,
        signature: createTxResponse.signature,
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
