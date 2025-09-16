import { z } from "zod";
import { getSwapHandler } from "../../handlers/dex-gateway/getSwap.handler";
import { baseProcedure } from "../base.procedure";

const getSwapInputSchema = z.object({
	amountIn: z.bigint(),
	isSwapXToY: z.boolean(),
	label: z.string().optional().default(""),
	minOut: z.bigint(),
	trackingId: z.string(),
	refCode: z.string().optional().default(""),
	tokenMintX: z.string(),
	tokenMintY: z.string(),
	userAddress: z.string(),
	$typeName: z
		.literal("darklake.v1.CreateUnsignedTransactionRequest")
		.default("darklake.v1.CreateUnsignedTransactionRequest"),
});

export const getSwap = baseProcedure
	.input(getSwapInputSchema)
	.handler(async ({ input }) => {
		return await getSwapHandler(input);
	});
