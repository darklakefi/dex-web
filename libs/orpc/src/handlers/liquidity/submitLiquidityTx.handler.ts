"use server";

import { VersionedTransaction } from "@solana/web3.js";
import { getHelius } from "../../getHelius";

export interface SubmitLiquidityTransactionInput {
	signed_transaction: string; // Base64 encoded signed transaction
}

export interface SubmitLiquidityTransactionOutput {
	success: boolean;
	signature?: string;
	error_logs?: string;
}

export async function submitLiquidityTransactionHandler(
	input: SubmitLiquidityTransactionInput,
): Promise<SubmitLiquidityTransactionOutput> {
	const { signed_transaction } = input;

	try {
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
			};
		}

		return {
			signature,
			success: true,
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
		};
	}
}
