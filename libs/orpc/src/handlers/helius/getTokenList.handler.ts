import type { GetTokenListInput } from "@/schemas/helius/getTokenList.schema";
import { helius } from "../../helius";

export async function getTokenListHandler({ input }: GetTokenListInput) {
  return await helius.rpc.searchAssets({
    cursor: input.cursor,
    limit: input.limit,
  });
}
