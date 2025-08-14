"use server";

import { Transaction } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "../../schemas/pools/submitWithdrawal.schema";

export async function submitWithdrawalHandler({
  signedTransaction,
}: SubmitWithdrawalInput): Promise<SubmitWithdrawalOutput> {
  try {
    const helius = getHelius();
    const connection = helius.connection;

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
    console.error("Error submitting withdrawal transaction:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    };
  }
}
