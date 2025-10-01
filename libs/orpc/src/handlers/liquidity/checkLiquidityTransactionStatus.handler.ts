"use server";

import { signature as toSignature } from "@solana/kit";
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
    const helius = getHelius();
    const { value } = await helius.getSignatureStatuses(
      [toSignature(signature)],
      {
        searchTransactionHistory: true,
      },
    );

    const status = value?.[0];

    if (!status) {
      return {
        signature,
        status: "pending",
      };
    }

    if (status.err) {
      return {
        error: JSON.stringify(status.err),
        signature,
        status: "failed",
      };
    }

    if (status.confirmationStatus === "finalized") {
      return {
        signature,
        status: "finalized",
      };
    }

    if (status.confirmationStatus === "confirmed") {
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
