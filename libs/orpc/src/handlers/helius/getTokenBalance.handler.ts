import { helius } from "@/helius";
import type { GetTokenBalanceInput } from "@/schemas/helius/getTokenBalance.schema";

export async function getTokenBalanceHandler({
  ownerAddress,
}: GetTokenBalanceInput) {
  return await helius.rpc.getAssetsByOwner({
    ownerAddress,
    page: 1,
  });
}
