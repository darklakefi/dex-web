import { helius } from "../../helius";
import type { GetTokenListInput } from "../../schemas/helius/getTokenList.schema";

export async function getTokenListHandler({ input }: GetTokenListInput) {
  return await helius.rpc.searchAssets({
    cursor: input.cursor,
    limit: input.limit,
  });
}
