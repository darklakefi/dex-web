import { client } from "@dex-web/orpc";
import {
	type PublicKey,
	type Transaction,
	VersionedTransaction,
} from "@solana/web3.js";
import { dismissToast, toast } from "../../../_utils/toast";

interface RequestLiquidityTransactionSigningProps {
	publicKey: PublicKey;
	signTransaction:
		| (<T extends Transaction | VersionedTransaction>(
				transaction: T,
		  ) => Promise<T>)
		| undefined;
	setLiquidityStep: (step: number) => void;
	unsignedTransaction: string;
	checkLiquidityTransactionStatus: (signature: string) => Promise<void>;
}
export async function requestLiquidityTransactionSigning({
	publicKey,
	signTransaction,
	setLiquidityStep,
	unsignedTransaction,
	checkLiquidityTransactionStatus,
}: RequestLiquidityTransactionSigningProps) {
	try {
		if (!publicKey) throw new Error("Wallet not connected!");
		if (!signTransaction)
			throw new Error("Wallet does not support transaction signing!");

		setLiquidityStep(2);
		toast({
			description:
				"Tokens will be secured until slippage verification completes.",
			title: "Confirm liquidity [2/3]",
			variant: "loading",
		});

		const unsignedTransactionBuffer = Buffer.from(
			unsignedTransaction,
			"base64",
		);
		const transaction = VersionedTransaction.deserialize(
			unsignedTransactionBuffer,
		);

		const signedTransaction = await signTransaction(transaction);
		const signedTransactionBase64 = Buffer.from(
			signedTransaction.serialize(),
		).toString("base64");

		const signedTxRequest = {
			signed_transaction: signedTransactionBase64,
		};

		setLiquidityStep(3);
		toast({
			description: "Submitting liquidity transaction to Solana network.",
			title: "Confirming transaction [3/3]",
			variant: "loading",
		});

		const liquidityTxResponse =
			await client.liquidity.submitLiquidityTransaction(signedTxRequest);

		if (liquidityTxResponse.success && liquidityTxResponse.signature) {
			checkLiquidityTransactionStatus(liquidityTxResponse.signature);
		} else {
			const errorMessage =
				liquidityTxResponse.error_logs || "Unknown error occurred";
			console.error("Liquidity transaction submission failed:", {
				error_logs: liquidityTxResponse.error_logs,
				success: liquidityTxResponse.success,
			});
			throw new Error(`Liquidity transaction failed: ${errorMessage}`);
		}
	} catch (error) {
		console.error("Signing error:", error);
		dismissToast();
		toast({
			description: `${error instanceof Error ? error.message : "Unknown error occurred"}`,
			title: "Signing Error",
			variant: "error",
		});
		setLiquidityStep(0);
	}
}
