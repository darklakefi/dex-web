import {
  randProductDescription,
  randProductName,
  randUuid,
  seed,
} from "@ngneat/falso";
import { type DAS, Interface, OwnershipModel } from "helius-sdk";
import { times } from "remeda";
import { vi } from "vitest";

const FIXED_SEED = "1234567890123456";

function generateAssetResponseList(): DAS.GetAssetResponseList {
  seed(FIXED_SEED);
  return {
    cursor: "123",
    items: times(10, (_i) => ({
      burnt: false,
      content: {
        $schema: "https://schema.dexscreener.com/asset.schema.json",
        json_uri: "https://schema.dexscreener.com/asset.schema.json",
        metadata: {
          description: randProductDescription(),
          name: randProductName(),
          symbol: randProductName().slice(0, 3).toUpperCase(),
        },
      },
      id: randUuid(),
      interface: Interface.V1NFT,
      mutable: true,
      ownership: {
        delegate: undefined,
        delegated: false,
        frozen: false,
        owner: randUuid(),
        ownership_model: OwnershipModel.SINGLE,
      },
    })),
    limit: 10,
    total: 10,
  };
}

module.exports = {
  helius: {
    rpc: {
      getAssetsByOwner: vi.fn(() => generateAssetResponseList()),
      searchAssets: vi.fn(() => generateAssetResponseList()),
    },
  },
};
