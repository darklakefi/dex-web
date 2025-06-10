import { helius } from "../../helius";
import type {
  GetTokenListInput,
  GetTokenListOutput,
} from "../../schemas/helius/getTokenList.schema";

export async function getTokenListHandler({
  cursor,
  limit,
}: GetTokenListInput): Promise<GetTokenListOutput> {
  const response = await helius.rpc.searchAssets({
    cursor,
    limit,
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
