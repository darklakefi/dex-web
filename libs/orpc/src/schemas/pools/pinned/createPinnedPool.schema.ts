import { z } from "zod/v4";
import { pinnedPoolSchema } from "./pinnedPool.schema";

export const createPinnedPoolInputSchema = pinnedPoolSchema.pick({
	apr: true,
	chain: true,
	id: true,
	name: true,
	tokenXMint: true,
	tokenXSymbol: true,
	tokenYMint: true,
	tokenYSymbol: true,
});

export const createPinnedPoolOutputSchema = z.object({
	id: z.string().min(1, "ID is required"),
	message: z.string().optional(),
	success: z.boolean(),
});

export type CreatePinnedPoolInput = z.infer<typeof createPinnedPoolInputSchema>;
export type CreatePinnedPoolOutput = z.infer<
	typeof createPinnedPoolOutputSchema
>;
