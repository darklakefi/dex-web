"use server";

import { helius } from "../../helius";
import type {
  SearchAssetsInput,
  SearchAssetsOutput,
} from "../../schemas/helius/searchAssets.schema";

export async function searchAssetsHandler({
  limit = 100,
}: SearchAssetsInput): Promise<SearchAssetsOutput> {
  try {
    const result = await helius.rpc.searchAssets({
      limit,
    });

    const { items } = await result;

    const tokenListOutput = items.map((item) => {
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
  } catch (error) {
    console.error(error);
    return [];
  }
}
