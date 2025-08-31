import { z } from "zod/v4";
import { pinnedPoolSchema } from "./pinnedPool.schema";

export const updatePinnedPoolInputSchema = pinnedPoolSchema
	.pick({
		apr: true,
		chain: true,
		id: true,
		name: true,
		tokenXMint: true,
		tokenXSymbol: true,
		tokenYMint: true,
		tokenYSymbol: true,
	})
	.partial({
		apr: true,
		chain: true,
		name: true,
		tokenXMint: true,
		tokenXSymbol: true,
		tokenYMint: true,
		tokenYSymbol: true,
	})
	.extend({ id: pinnedPoolSchema.shape.id });

export const updatePinnedPoolOutputSchema = z.object({
	id: z.string().min(1, "ID is required"),
	message: z.string().optional(),
	success: z.boolean(),
});

export type UpdatePinnedPoolInput = z.infer<typeof updatePinnedPoolInputSchema>;
export type UpdatePinnedPoolOutput = z.infer<
	typeof updatePinnedPoolOutputSchema
>;
