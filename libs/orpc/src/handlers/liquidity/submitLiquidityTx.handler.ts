"use server";

import {
	type BlockheightBasedTransactionConfirmationStrategy,
	VersionedTransaction,
} from "@solana/web3.js";
import { getHelius } from "../../getHelius";

export interface SubmitLiquidityTransactionInput {
	signed_transaction: string;
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
		const transactionBuffer = Buffer.from(signed_transaction, "base64");
		const transaction = VersionedTransaction.deserialize(transactionBuffer);

		const helius = getHelius();
		const connection = helius.connection;

		const signature = await connection.sendRawTransaction(
			transaction.serialize(),
			{
				maxRetries: 3,
				preflightCommitment: "confirmed",
				skipPreflight: false,
			},
		);
		const latestBlockhash = await connection.getLatestBlockhash();

		const transactionConfirmationStrategy = {
			blockhash: latestBlockhash.blockhash,
			lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
			signature,
		} satisfies BlockheightBasedTransactionConfirmationStrategy;

		const confirmation = await connection.confirmTransaction(
			transactionConfirmationStrategy,
			"confirmed",
		);

		if (confirmation.value.err) {
			console.error("Transaction confirmation failed:", confirmation.value.err);
			return {
				error_logs: `Transaction failed: ${JSON.stringify(
					confirmation.value.err,
				)}`,
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
