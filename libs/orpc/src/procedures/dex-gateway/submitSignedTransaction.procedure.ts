import { z } from "zod";
import { submitSignedTransactionHandler } from "../../handlers/dex-gateway/submitSignedTransaction.handler";
import { baseProcedure } from "../base.procedure";

const submitSignedTransactionInputSchema = z.object({
	signedTransaction: z.string(),
	trackingId: z.string(),
	tradeId: z.string(),
	$typeName: z
		.literal("darklake.v1.SendSignedTransactionRequest")
		.default("darklake.v1.SendSignedTransactionRequest"),
});

export const submitSignedTransaction = baseProcedure
	.input(submitSignedTransactionInputSchema)
	.handler(async ({ input }) => {
		return await submitSignedTransactionHandler(input);
	});
