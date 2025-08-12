"use server";

import { VersionedTransaction } from "@solana/web3.js";
import { getHelius } from "../../getHelius";

export interface SubmitLiquidityTxInput {
  signed_transaction: string; // Base64 encoded signed transaction
  tracking_id: string;
}

export interface SubmitLiquidityTxOutput {
  success: boolean;
  signature?: string;
  error_logs?: string;
  tracking_id: string;
}

export async function submitLiquidityTxHandler(
  input: SubmitLiquidityTxInput,
): Promise<SubmitLiquidityTxOutput> {
  const { signed_transaction, tracking_id } = input;

  try {
    console.log(
      "Direct liquidity transaction submission for tracking_id:",
      tracking_id,
    );

    // Deserialize the signed transaction
    const transactionBuffer = Buffer.from(signed_transaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // Get Solana connection
    const helius = getHelius();
    const connection = helius.connection;

    // Submit transaction directly to Solana
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        maxRetries: 3,
        preflightCommitment: "confirmed",
        skipPreflight: false,
      },
    );

    console.log("Liquidity transaction submitted successfully:", {
      signature,
      tracking_id,
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed",
    );

    if (confirmation.value.err) {
      console.error("Transaction confirmation failed:", confirmation.value.err);
      return {
        error_logs: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        success: false,
        tracking_id,
      };
    }

    return {
      signature,
      success: true,
      tracking_id,
    };
  } catch (error) {
    console.error("Error submitting liquidity transaction:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      error_logs: errorMessage,
      success: false,
      tracking_id,
    };
  }
}
