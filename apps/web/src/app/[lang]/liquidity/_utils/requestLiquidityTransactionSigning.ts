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

interface RequestLiquidityTransactionSigningProps {
  publicKey: PublicKey;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
  setLiquidityStep: (step: number) => void;
  unsignedTransaction: string;
  trackingId: string;
  onSuccess: () => void;
}
export async function requestLiquidityTransactionSigning({
  publicKey,
  signTransaction,
  setLiquidityStep,
  unsignedTransaction,
  trackingId,
  onSuccess,
}: RequestLiquidityTransactionSigningProps) {
  try {
    if (!publicKey) throw new Error("Wallet not connected!");
    if (!signTransaction)
      throw new Error("Wallet does not support transaction signing!");

    setLiquidityStep(2);
    toast({
      description:
        "Tokens will be secured until slippage verification completes.",
      title: "Confirm liquidity [2/3]",
      variant: "loading",
    });

    const transaction = deserializeVersionedTransaction(unsignedTransaction);

    const signedTransaction = await signTransactionWithRecovery(
      transaction,
      signTransaction,
    );
    const signedTransactionBase64 = Buffer.from(
      signedTransaction.serialize(),
    ).toString("base64");

    setLiquidityStep(3);
    toast({
      description: "Submitting liquidity transaction to Solana network.",
      title: "Confirming transaction [3/3]",
      variant: "loading",
    });

    const liquidityTxResponse = await client.dexGateway.submitSignedTransaction(
      {
        signedTransaction: signedTransactionBase64,
        trackingId,
        tradeId: "", // Empty tradeId for liquidity operations (no trade record exists)
      },
    );

    if (liquidityTxResponse.success) {
      dismissToast();
      toast({
        description: "Liquidity added successfully!",
        title: "Success",
        variant: "success",
      });
      onSuccess();
    } else {
      const errorLogs = liquidityTxResponse.errorLogs;
      const errorMessage = Array.isArray(errorLogs)
        ? errorLogs.join(", ")
        : typeof errorLogs === "string"
          ? errorLogs
          : "Unknown error occurred";
      console.error("Liquidity transaction submission failed:", {
        errorLogs: liquidityTxResponse.errorLogs,
        success: liquidityTxResponse.success,
      });
      throw new Error(`Liquidity transaction failed: ${errorMessage}`);
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
    setLiquidityStep(0);
  }
}
