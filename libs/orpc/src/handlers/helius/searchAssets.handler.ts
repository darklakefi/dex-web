import { helius } from "../../helius";
import type {
  SearchAssetsInput,
  SearchAssetsOutput,
} from "../../schemas/helius/searchAssets.schema";

export async function searchAssetsHandler({
  limit,
}: SearchAssetsInput): Promise<SearchAssetsOutput> {
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
