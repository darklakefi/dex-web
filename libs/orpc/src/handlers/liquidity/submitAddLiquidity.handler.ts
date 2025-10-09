"use server";

import { extractTransactionSignature } from "@dex-web/core";
import { type Connection, VersionedTransaction } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  SubmitAddLiquidityInput,
  SubmitAddLiquidityOutput,
} from "../../schemas/liquidity/submitAddLiquidity.schema";
import { handleTransactionError } from "../../utils/orpcErrorHandling";

async function attemptTransactionRecovery(
  error: unknown,
  connection: Connection,
  fallbackSignature?: string,
): Promise<SubmitAddLiquidityOutput | null> {
  const signature = extractTransactionSignature(error) ?? fallbackSignature;
  if (!signature) return null;

  try {
    const status = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const value = status.value?.[0];
    if (value && !value.err) {
      const confirmed =
        value.confirmationStatus === "confirmed" ||
        value.confirmationStatus === "finalized";
      if (confirmed) {
        return { signature, status: "confirmed", success: true };
      }
      return { signature, status: "submitted", success: true };
    }
    if (value?.err) {
      return null;
    }
  } catch (statusError) {
    console.warn("Could not verify transaction status:", statusError);
  }

  return {
    error:
      error instanceof Error
        ? error.message
        : "Transaction submitted but confirmation is pending",
    signature,
    status: "submitted",
    success: true,
  };
}

export async function submitAddLiquidityHandler({
  signedTransaction,
}: SubmitAddLiquidityInput): Promise<SubmitAddLiquidityOutput> {
  const helius = getHelius();
  const connection = helius.connection;
  let signature: string | undefined;

  try {
    const transactionBuffer = Buffer.from(signedTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");

    signature = await connection.sendRawTransaction(transaction.serialize(), {
      maxRetries: 3,
      preflightCommitment: "confirmed",
      skipPreflight: false,
    });

    try {
      await connection.confirmTransaction(
        {
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          signature,
        },
        "confirmed",
      );
    } catch (confirmError) {
      const recovered = await attemptTransactionRecovery(
        confirmError,
        connection,
        signature,
      );
      if (recovered) {
        return recovered;
      }

      return {
        error:
          confirmError instanceof Error
            ? confirmError.message
            : "Transaction confirmation failed",
        signature,
        status: "submitted",
        success: true,
      };
    }

    return {
      signature,
      status: "confirmed",
      success: true,
    };
  } catch (error) {
    const recovery = await attemptTransactionRecovery(
      error,
      connection,
      signature,
    );
    if (recovery) {
      return recovery;
    }

    handleTransactionError(error, "submitAddLiquidity");
  }
}
