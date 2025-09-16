import { create } from "@bufbuild/protobuf";
import { CreateUnsignedTransactionRequestPB } from "@dex-web/grpc-client";
import { z } from "zod";
import { getSwapHandler } from "../../handlers/dex-gateway/getSwap.handler";
import { baseProcedure } from "../base.procedure";

const getSwapInputSchema = z.object({
	amountIn: z.bigint(),
	isSwapXToY: z.boolean(),
	label: z.string().optional().default(""),
	minOut: z.bigint(),
	refCode: z.string().optional().default(""),
	tokenMintX: z.string(),
	tokenMintY: z.string(),
	userAddress: z.string(),
});

export const getSwap = baseProcedure
	.input(getSwapInputSchema)
	.handler(async ({ input }) => {
		const request = create(CreateUnsignedTransactionRequestPB, {
			...input,
			label: input.label || "",
			refCode: input.refCode || "",
			trackingId: `id-${Math.random().toString(16).slice(2)}`,
		});
		return await getSwapHandler(request);
	});
