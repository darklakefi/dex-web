"use server";

import { database, pinnedPools } from "@dex-web/db";
import { desc } from "drizzle-orm";
import type { ListPinnedPoolsOutput } from "../../../schemas/pools/pinned/listPinnedPools.schema";

export async function listPinnedPoolsHandler(): Promise<ListPinnedPoolsOutput> {
  try {
    const rows = await database
      .select({
        apr: pinnedPools.apr,
        chain: pinnedPools.chain,
        created_at: pinnedPools.created_at,
        id: pinnedPools.id,
        name: pinnedPools.name,
        tokenXMint: pinnedPools.token_x_mint,
        tokenXSymbol: pinnedPools.token_x_symbol,
        tokenYMint: pinnedPools.token_y_mint,
        tokenYSymbol: pinnedPools.token_y_symbol,
        updated_at: pinnedPools.updated_at,
      })
      .from(pinnedPools)
      .orderBy(desc(pinnedPools.created_at));

    const items = rows.map((row) => ({
      ...row,
      apr: Number(row.apr),
      created_at:
        (row.created_at as unknown as Date | undefined)?.toISOString?.() ??
        String(row.created_at ?? ""),
      updated_at:
        (row.updated_at as unknown as Date | undefined)?.toISOString?.() ??
        String(row.updated_at ?? ""),
    }));
    return items;
  } catch (error) {
    console.error("Error listing pinned pools:", error);
    return [];
  }
}
