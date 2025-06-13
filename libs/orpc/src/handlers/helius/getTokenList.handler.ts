import { helius } from "../../helius";
import type {
  GetTokenListInput,
  GetTokenListOutput,
} from "../../schemas/helius/getTokenList.schema";

export async function getTokenListHandler({
  limit,
}: GetTokenListInput): Promise<GetTokenListOutput> {
  const response = await helius.rpc.searchAssets({
    limit,
    tokenType: "fungible",
  });

  const tokenListOutput = response.items.map((item) => {
    const imageUrl =
      item.content?.files?.find((file) => file.mime?.includes("image"))
        ?.cdn_uri ?? null;

    return {
      description: item.content?.metadata?.description ?? "",
      id: item.id,
      image: imageUrl ? { url: imageUrl } : null,
      name: item.content?.metadata?.name ?? "",
      symbol: item.content?.metadata?.symbol ?? "",
    };
  });

  return tokenListOutput;
}
