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
import { Connection } from "@solana/web3.js";
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
    if (!publicKey) throw new Error("Wallet not connected!");
    if (!signTransaction)
      throw new Error("Wallet does not support transaction signing!");

    const messages = {
      ...DEFAULT_MESSAGES[transactionType],
      ...customMessages,
    };

    setStep?.(2);
    toast({
      description: messages.step2Description ?? "",
      title: messages.step2Title ?? "Confirm transaction",
      variant: "loading",
    });

    const transaction = deserializeVersionedTransaction(unsignedTransaction);

    // Simulate transaction before signing
    console.log("🔍 ===== TRANSACTION SIMULATION START =====");
    try {
      const network =
        process.env.NEXT_PUBLIC_NETWORK === "2" ? "devnet" : "mainnet-beta";
      const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
      const rpcUrl = `https://${network}.helius-rpc.com/?api-key=${apiKey}`;
      const connection = new Connection(rpcUrl, "confirmed");

      console.log(`🌐 Network: ${network}`);
      console.log(`🔗 RPC URL: ${rpcUrl.replace(apiKey || "", "***")}`);
      console.log(`👤 Public Key: ${publicKey.toBase58()}`);

      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
      });

      console.log("📊 Simulation Result:", {
        err: simulation.value.err,
        logs: simulation.value.logs,
        returnData: simulation.value.returnData,
        unitsConsumed: simulation.value.unitsConsumed,
      });

      if (simulation.value.err) {
        console.error("❌ SIMULATION FAILED:", simulation.value.err);
        console.error("📝 Error Logs:");
        simulation.value.logs?.forEach((log, i) => {
          console.error(`  ${i + 1}. ${log}`);
        });
      } else {
        console.log("✅ SIMULATION SUCCEEDED");
        console.log("📝 Transaction Logs:");
        simulation.value.logs?.forEach((log, i) => {
          console.log(`  ${i + 1}. ${log}`);
        });
        console.log(`⚡ Compute Units Used: ${simulation.value.unitsConsumed}`);
      }
    } catch (simError) {
      console.error("⚠️ Simulation error (non-fatal):", simError);
    }
    console.log("🔍 ===== TRANSACTION SIMULATION END =====\n");

    const signedTransaction = await signTransactionWithRecovery(
      transaction,
      signTransaction,
    );
    const signedTransactionBase64 = Buffer.from(
      signedTransaction.serialize(),
    ).toString("base64");

    setStep?.(3);
    toast({
      description: messages.step3Description ?? "",
      title: messages.step3Title ?? "Confirming transaction",
      variant: "loading",
    });

    const response = await client.liquidity.submitAddLiquidity({
      signedTransaction: signedTransactionBase64,
      tokenXMint,
      tokenYMint,
      userAddress,
    });

    if (response.success) {
      dismissToast();
      toast({
        description: messages.successDescription ?? "",
        title: messages.successTitle ?? "Success",
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
