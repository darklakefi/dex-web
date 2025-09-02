"use server";
import { database, pinnedPools } from "@dex-web/db";
import { eq } from "drizzle-orm";
import type {
	UpdatePinnedPoolInput,
	UpdatePinnedPoolOutput,
} from "../../../schemas/pools/pinned/updatePinnedPool.schema";
// simplified: update strictly by id (no pair checks)

export async function updatePinnedPoolHandler(
	input: UpdatePinnedPoolInput,
): Promise<UpdatePinnedPoolOutput> {
	try {
		const updateData: Partial<typeof pinnedPools.$inferInsert> = {
			...(input.name !== undefined && { name: input.name }),
			...(input.chain !== undefined && { chain: input.chain }),
			...(input.tokenXSymbol !== undefined && {
				token_x_symbol: input.tokenXSymbol,
			}),
			...(input.tokenYSymbol !== undefined && {
				token_y_symbol: input.tokenYSymbol,
			}),
			...(input.tokenXMint !== undefined && { token_x_mint: input.tokenXMint }),
			...(input.tokenYMint !== undefined && { token_y_mint: input.tokenYMint }),
			...(input.apr !== undefined && { apr: input.apr }),
		};

		if (Object.keys(updateData).length === 0) {
			return { id: input.id, message: "No changes", success: true };
		}

		await database
			.update(pinnedPools)
			.set(updateData)
			.where(eq(pinnedPools.id, input.id));
		return { id: input.id, message: "Pinned pool updated", success: true };
	} catch (error) {
		console.error("Error updating pinned pool:", error);
		return {
			id: input.id,
			message:
				error instanceof Error ? error.message : "Failed to update pinned pool",
			success: false,
		};
	}
}
