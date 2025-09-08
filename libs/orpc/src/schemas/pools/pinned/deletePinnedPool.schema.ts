import { z } from "zod/v4";

export const deletePinnedPoolInputSchema = z.object({
	apr: z.number().optional(),
	chain: z.string().optional(),
	created_at: z.string().optional(),
	id: z.string().min(1, "ID is required"),
	name: z.string().optional(),
	tokenXMint: z.string().min(1, "Token X Mint is required"),
	tokenXSymbol: z.string().optional(),
	tokenYMint: z.string().min(1, "Token Y Mint is required"),
	tokenYSymbol: z.string().optional(),
	updated_at: z.string().optional(),
});

export const deletePinnedPoolOutputSchema = z.object({
	id: z.string().min(1, "ID is required"),
	message: z.string().optional(),
	success: z.boolean(),
});

export type DeletePinnedPoolInput = z.infer<typeof deletePinnedPoolInputSchema>;
export type DeletePinnedPoolOutput = z.infer<
	typeof deletePinnedPoolOutputSchema
>;
