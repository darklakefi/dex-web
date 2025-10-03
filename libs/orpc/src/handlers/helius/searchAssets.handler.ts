"use server";

import type { Asset } from "helius-sdk/dist/types";
import { getHelius } from "../../getHelius";
import type {
  SearchAssetsInput,
  SearchAssetsOutput,
} from "../../schemas/helius/searchAssets.schema";

export async function searchAssetsHandler({
  limit = 100,
}: SearchAssetsInput): Promise<SearchAssetsOutput> {
  try {
    const helius = getHelius();

    const result = await helius.searchAssets({
      limit,
    });

    const tokenListOutput = result.items.map((item: Asset) => {
      const imageUrl = item.content?.files?.find((file: { mime?: string }) =>
        file.mime?.includes("image"),
      )?.cdn_uri;

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
