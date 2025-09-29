"use server";

import { getHelius } from "../../getHelius";

export interface CheckLiquidityTransactionStatusInput {
  signature: string;
}

export interface CheckLiquidityTransactionStatusOutput {
  status: "pending" | "confirmed" | "finalized" | "failed";
  error?: string;
  signature: string;
}

export async function checkLiquidityTransactionStatusHandler(
  input: CheckLiquidityTransactionStatusInput,
): Promise<CheckLiquidityTransactionStatusOutput> {
  const { signature } = input;

  try {
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
      };
    }

    if (status.value.err) {
      return {
        error: JSON.stringify(status.value.err),
        signature,
        status: "failed",
      };
    }

    // Map Solana confirmation status to our status
    if (status.value.confirmationStatus === "finalized") {
      return {
        signature,
        status: "finalized",
      };
    }

    if (status.value.confirmationStatus === "confirmed") {
      return {
        signature,
        status: "confirmed",
      };
    }

    return {
      signature,
      status: "pending",
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
    };
  }
}
