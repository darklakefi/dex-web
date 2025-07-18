import type { DAS } from "helius-sdk";

export function getAssetsFromResponse(response: DAS.GetAssetResponseList) {
  return response.items.map((item) => ({
    description: item.content?.metadata?.description ?? "",
    id: item.id,
    image: null,
    name: item.content?.metadata?.name ?? "",
    symbol: item.content?.metadata?.symbol ?? "",
  }));
}
