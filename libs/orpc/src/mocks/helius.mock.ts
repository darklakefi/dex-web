import { vi } from "vitest";
import { generateAssetResponseList } from "./helpers/generateMockAssetResponseList";
import { generateTokenAccountsResponseList } from "./helpers/generateMockTokenAccountResponse";
import { generateMockTokenMetadata } from "./helpers/generateMockTokenMetadata";

export function getHelius() {
  return {
    getAsset: vi.fn(() => Promise.resolve(generateMockTokenMetadata())),
    getAssetsByOwner: vi.fn(() => Promise.resolve(generateAssetResponseList())),
    getTokenAccounts: vi.fn(() =>
      Promise.resolve(generateTokenAccountsResponseList()),
    ),
    searchAssets: vi.fn(() => Promise.resolve(generateAssetResponseList())),
  };
}
