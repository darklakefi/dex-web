"use server";

import { VersionedTransaction } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import { handleTransactionError } from "../../utils/orpcErrorHandling";

export interface SubmitLiquidityTransactionInput {
  signed_transaction: string;
}

export interface SubmitLiquidityTransactionOutput {
  success: boolean;
  signature?: string;
  error_logs?: string;
  simulation_error?: string;
}

const RETRY_DELAYS = [1000, 2000, 4000, 8000];
const MAX_RETRIES = 3;
const CONFIRMATION_TIMEOUT = 60000;

export async function submitLiquidityTransactionHandler(
  input: SubmitLiquidityTransactionInput,
): Promise<SubmitLiquidityTransactionOutput> {
  const { signed_transaction } = input;

  try {
    const transactionBuffer = Buffer.from(signed_transaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    const helius = getHelius();
    const connection = helius.connection;

    const simulation = await connection.simulateTransaction(transaction, {
      commitment: "confirmed",
      sigVerify: false,
    });

    if (simulation.value.err) {
      console.error("Transaction simulation failed:", simulation.value.err);
      return {
        error_logs: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
        simulation_error: JSON.stringify(simulation.value.err),
        success: false,
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          {
            maxRetries: 1,
            preflightCommitment: "confirmed",
            skipPreflight: true,
          },
        );

        const confirmed = await pollTransactionConfirmation(
          connection,
          signature,
        );

        if (confirmed.success) {
          return {
            signature,
            success: true,
          };
        } else if (confirmed.error) {
          return {
            error_logs: confirmed.error,
            success: false,
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (isRateLimitError(error)) {
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAYS[attempt]),
            );
            continue;
          }
        }

        if (attempt === MAX_RETRIES) {
          throw lastError;
        }

        const delay = RETRY_DELAYS[attempt] || 1000;
        await new Promise((resolve) => setTimeout(resolve, delay / 2));
      }
    }

    throw lastError || new Error("Transaction failed after all retries");
  } catch (error) {
    handleTransactionError(error, "submitLiquidityTransaction");
  }
}

async function pollTransactionConfirmation(connection: any, signature: string) {
  const startTime = Date.now();

  while (Date.now() - startTime < CONFIRMATION_TIMEOUT) {
    try {
      const status = await connection.getSignatureStatus(signature);

      if (
        status.value?.confirmationStatus === "confirmed" ||
        status.value?.confirmationStatus === "finalized"
      ) {
        if (status.value.err) {
          return {
            error: `Transaction failed: ${JSON.stringify(status.value.err)}`,
            success: false,
          };
        }
        return { success: true };
      }

      if (status.value?.err) {
        return {
          error: `Transaction failed: ${JSON.stringify(status.value.err)}`,
          success: false,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn("Error polling transaction status:", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return {
    error: "Transaction confirmation timeout",
    success: false,
  };
}

function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
}

function categorizeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return typeof error === "string" ? error : "Unknown error occurred";
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient lamports")
  ) {
    return "Insufficient funds for transaction";
  }

  if (message.includes("slippage") || message.includes("price impact")) {
    return "Transaction failed due to slippage. Try adjusting slippage tolerance";
  }

  if (
    message.includes("blockhash not found") ||
    message.includes("block height exceeded")
  ) {
    return "Transaction expired. Please try again";
  }

  if (isRateLimitError(error)) {
    return "Network congestion. Please wait a moment and try again";
  }

  if (message.includes("timeout")) {
    return "Network timeout. Please check your connection and try again";
  }

  return error.message;
}
