import { helius } from "@/helius";
import type { GetTokenListInput } from "@/schemas/helius/getTokenList.schema";

export async function getTokenListHandler({
  cursor,
  limit,
}: GetTokenListInput) {
  return await helius.rpc.searchAssets({
    cursor,
    limit,
  });
}
