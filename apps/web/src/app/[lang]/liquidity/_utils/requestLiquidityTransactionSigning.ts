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
  tokenXMint: string;
  tokenYMint: string;
  onSuccess: () => void;
  trackingId: string;
}
export async function requestLiquidityTransactionSigning({
  publicKey,
  signTransaction,
  setLiquidityStep,
  unsignedTransaction,
  tokenXMint,
  tokenYMint,
  onSuccess,
  trackingId: _trackingId,
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

    const liquidityTxResponse = await client.liquidity.submitAddLiquidity({
      signedTransaction: signedTransactionBase64,
      tokenXMint,
      tokenYMint,
      userAddress: publicKey.toBase58(),
    });

    if (liquidityTxResponse.success) {
      dismissToast();
      toast({
        description: "Liquidity added successfully!",
        title: "Success",
        variant: "success",
      });
      onSuccess();
    } else {
      const errorMessage =
        liquidityTxResponse.error || "Unknown error occurred";
      console.error("Liquidity transaction submission failed:", {
        error: liquidityTxResponse.error,
        signature: liquidityTxResponse.signature,
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
