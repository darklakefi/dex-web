"use server";

import { database, pinnedPools } from "@dex-web/db";
import { eq } from "drizzle-orm";
import type {
	DeletePinnedPoolInput,
	DeletePinnedPoolOutput,
} from "../../../schemas/pools/pinned/deletePinnedPool.schema";

export async function deletePinnedPoolHandler(
	input: DeletePinnedPoolInput,
): Promise<DeletePinnedPoolOutput> {
	try {
		const deleted = await database
			.delete(pinnedPools)
			.where(eq(pinnedPools.id, input.id))
			.returning({ id: pinnedPools.id });

		console.log("deleted", deleted);
		if (deleted.length === 0) {
			return {
				id: input.id,
				message: "Pinned pool not found",
				success: false,
			};
		}

		return { id: input.id, message: "Pinned pool deleted", success: true };
	} catch (error) {
		console.error("Error deleting pinned pool:", error);
		return {
			id: input.id,
			message:
				error instanceof Error
					? `${error.message}`
					: "Failed to delete pinned pool",
			success: false,
		};
	}
}
