"use server";

import { getHelius } from "../../getHelius";

export interface CheckLiquidityTxStatusInput {
  signature: string;
  tracking_id: string;
}

export interface CheckLiquidityTxStatusOutput {
  status: "pending" | "confirmed" | "finalized" | "failed";
  error?: string;
  signature: string;
  tracking_id: string;
}

export async function checkLiquidityTxStatusHandler(
  input: CheckLiquidityTxStatusInput,
): Promise<CheckLiquidityTxStatusOutput> {
  const { signature, tracking_id } = input;

  try {
    console.log(
      "Checking liquidity transaction status for signature:",
      signature,
    );

    // Get Solana connection
    const helius = getHelius();
    const connection = helius.connection;

    // Check transaction status
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });

    if (!status.value) {
      return {
        signature,
        status: "pending",
        tracking_id,
      };
    }

    if (status.value.err) {
      return {
        error: JSON.stringify(status.value.err),
        signature,
        status: "failed",
        tracking_id,
      };
    }

    // Map Solana confirmation status to our status
    if (status.value.confirmationStatus === "finalized") {
      return {
        signature,
        status: "finalized",
        tracking_id,
      };
    }

    if (status.value.confirmationStatus === "confirmed") {
      return {
        signature,
        status: "confirmed",
        tracking_id,
      };
    }

    return {
      signature,
      status: "pending",
      tracking_id,
    };
  } catch (error) {
    console.error("Error checking liquidity transaction status:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return {
      error: errorMessage,
      signature,
      status: "failed",
      tracking_id,
    };
  }
}
