"use server";

import { extractTransactionSignature } from "@dex-web/core";
import { Transaction } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "../../schemas/liquidity/submitWithdrawal.schema";
import { handleTransactionError } from "../../utils/orpcErrorHandling";

async function attemptTransactionRecovery(
  error: unknown,
  connection: any,
): Promise<{ signature: string; success: boolean } | null> {
  const signature = extractTransactionSignature(error);
  if (!signature) return null;

  try {
    const status = await connection.getSignatureStatus(signature);
    if (status.value && !status.value.err) {
      console.log("Transaction actually succeeded despite error:", signature);
      return { signature, success: true };
    }
  } catch (statusError) {
    console.warn("Could not verify transaction status:", statusError);
  }

  return null;
}

export async function submitWithdrawalHandler({
  signedTransaction,
}: SubmitWithdrawalInput): Promise<SubmitWithdrawalOutput> {
  const helius = getHelius();
  const connection = helius.connection;

  try {
    const transactionBuffer = Buffer.from(signedTransaction, "base64");
    const transaction = Transaction.from(transactionBuffer);

    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        preflightCommitment: "confirmed",
        skipPreflight: false,
      },
    );

    await connection.confirmTransaction(signature, "confirmed");

    return {
      signature,
      success: true,
    };
  } catch (error) {
    const recovery = await attemptTransactionRecovery(error, connection);
    if (recovery) {
      return recovery;
    }

    handleTransactionError(error, "submitWithdrawal");
  }
}
