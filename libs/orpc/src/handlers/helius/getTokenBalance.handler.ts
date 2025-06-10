import { helius } from "@/helius";
import type {
  GetTokenBalanceInput,
  GetTokenBalanceOutput,
} from "@/schemas/helius/getTokenBalance.schema";
import { getAssetsFromResponse } from "@/utils/getAssetsFromResponse";
import { getTokenAccountsFromResponse } from "@/utils/getTokenAccountsFromResponse";

export async function getTokenBalanceHandler({
  ownerAddress,
}: GetTokenBalanceInput): Promise<GetTokenBalanceOutput> {
  const getAssetsByOwnerResponse = await helius.rpc.getAssetsByOwner({
    ownerAddress,
    page: 1,
  });

  const getTokenAccountsResponse = await helius.rpc.getTokenAccounts({
    owner: ownerAddress,
    page: 1,
  });

  const tokenBalanceOutput = {
    assets: getAssetsFromResponse(getAssetsByOwnerResponse),
    ownerAddress,
    tokenAccounts: getTokenAccountsFromResponse(getTokenAccountsResponse) ?? [],
    total: getAssetsByOwnerResponse.total,
  } satisfies GetTokenBalanceOutput;

  return tokenBalanceOutput;
}
