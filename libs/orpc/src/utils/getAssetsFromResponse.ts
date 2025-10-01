import type { GetAssetResponseList } from "helius-sdk/types/das";

export function getAssetsFromResponse(response: GetAssetResponseList) {
  return response.items.map((item) => ({
    description: item.content?.metadata?.description ?? "",
    id: item.id,
    image: null,
    name: item.content?.metadata?.name ?? "",
    symbol: item.content?.metadata?.symbol ?? "",
  }));
}
