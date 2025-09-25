"use server";

import { database, pinnedPools } from "@dex-web/db";
import { sortSolanaAddresses } from "@dex-web/utils";
import { and, eq } from "drizzle-orm";
import type {
  CreatePinnedPoolInput,
  CreatePinnedPoolOutput,
} from "../../../schemas/pools/pinned/createPinnedPool.schema";

export async function createPinnedPoolHandler(
  input: CreatePinnedPoolInput,
): Promise<CreatePinnedPoolOutput> {
  try {
    const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
      input.tokenXMint,
      input.tokenYMint,
    );
    const existing = await database
      .select()
      .from(pinnedPools)
      .where(
        and(
          eq(pinnedPools.token_x_mint, tokenXAddress),
          eq(pinnedPools.token_y_mint, tokenYAddress),
        ),
      );

    if (Array.isArray(existing) && existing.length > 0) {
      throw new Error("Pinned pool with the same token pair already exists");
    }

    await database.insert(pinnedPools).values({
      apr: input.apr,
      chain: input.chain,
      id: input.id,
      name: input.name,
      token_x_mint: tokenXAddress,
      token_x_symbol: input.tokenXSymbol,
      token_y_mint: tokenYAddress,
      token_y_symbol: input.tokenYSymbol,
    });

    return { id: input.id, message: "Pinned pool created", success: true };
  } catch (error) {
    console.error("Error creating pinned pool:", error);
    return {
      id: input.id,
      message:
        error instanceof Error
          ? `${error.message}`
          : "Failed to create pinned pool",
      success: false,
    };
  }
}
