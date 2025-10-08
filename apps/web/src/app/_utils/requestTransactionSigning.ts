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
import { dismissToast, toast } from "./toast";

export type TransactionType = "addLiquidity" | "createPool";

interface TransactionMessages {
  step2Title?: string;
  step2Description?: string;
  step3Title?: string;
  step3Description?: string;
  successTitle?: string;
  successDescription?: string;
}

const DEFAULT_MESSAGES: Record<TransactionType, TransactionMessages> = {
  addLiquidity: {
    step2Description:
      "Tokens will be secured until slippage verification completes.",
    step2Title: "Confirm liquidity [2/3]",
    step3Description: "Submitting liquidity transaction to Solana network.",
    step3Title: "Confirming transaction [3/3]",
    successDescription: "Liquidity added successfully!",
    successTitle: "Success",
  },
  createPool: {
    step2Description:
      "Tokens will be secured until slippage verification completes.",
    step2Title: "Confirm pool creation [2/3]",
    step3Description: "Submitting pool creation transaction to Solana network.",
    step3Title: "Confirming transaction [3/3]",
    successDescription: "Pool created successfully!",
    successTitle: "Success",
  },
};

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
  customMessages?: TransactionMessages;
  trackingId?: string;
}

/**
 * Generic transaction signing utility for Solana transactions.
 * Handles the common flow of:
 * 1. Deserializing the unsigned transaction
 * 2. Signing with the wallet
 * 3. Submitting to the Solana network
 * 4. Handling success/error states with toasts
 *
 * Used by liquidity operations (add liquidity, create pool) and can be extended
 * for other transaction types.
 *
 * @param params - Transaction signing parameters
 * @throws Error if wallet is not connected or signing fails
 */
export async function requestTransactionSigning({
  publicKey,
  signTransaction,
  unsignedTransaction,
  tokenXMint,
  tokenYMint,
  userAddress,
  onSuccess,
  transactionType,
  setStep,
  customMessages,
  trackingId: _trackingId,
}: RequestTransactionSigningParams): Promise<void> {
  try {
    // Validate wallet connection
    if (!publicKey) throw new Error("Wallet not connected!");
    if (!signTransaction)
      throw new Error("Wallet does not support transaction signing!");

    // Get messages (custom or default)
    const messages = {
      ...DEFAULT_MESSAGES[transactionType],
      ...customMessages,
    };

    // Step 2: Request signature from wallet
    setStep?.(2);
    toast({
      description: messages.step2Description,
      title: messages.step2Title,
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

    // Step 3: Submit to network
    setStep?.(3);
    toast({
      description: messages.step3Description,
      title: messages.step3Title,
      variant: "loading",
    });

    const response = await client.liquidity.submitAddLiquidity({
      signedTransaction: signedTransactionBase64,
      tokenXMint,
      tokenYMint,
      userAddress,
    });

    // Handle response
    if (response.success) {
      dismissToast();
      toast({
        description: messages.successDescription,
        title: messages.successTitle,
        variant: "success",
      });
      onSuccess();
    } else {
      const errorMessage = response.error || "Unknown error occurred";
      console.error("Transaction submission failed:", {
        error: response.error,
        signature: response.signature,
        success: response.success,
        transactionType,
      });
      throw new Error(`Transaction failed: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Transaction signing error:", error);
    dismissToast();

    const userMessage = getUserFriendlyErrorMessage(error);
    const isWarning = isWarningMessage(error);

    toast({
      description: userMessage,
      title: isWarning ? "Transaction Warning" : "Signing Error",
      variant: isWarning ? "warning" : "error",
    });

    setStep?.(0);
    throw error;
  }
}
