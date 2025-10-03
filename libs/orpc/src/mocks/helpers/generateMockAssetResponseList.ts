import {
  randProductDescription,
  randProductName,
  randUuid,
  seed,
} from "@ngneat/falso";
import type { GetAssetResponseList } from "helius-sdk/types/das";
import {
  Interface as AssetInterface,
  OwnershipModel,
} from "helius-sdk/types/enums";
import { times } from "remeda";
import { FIXED_SEED } from "./constants";

export function generateAssetResponseList({
  count = 10,
}: {
  count?: number;
} = {}): GetAssetResponseList {
  seed(FIXED_SEED);
  const owner = randUuid();
  return {
    cursor: "123",
    items: times(count, (_i) => ({
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
      interface: AssetInterface.V1_NFT,
      mutable: true,
      ownership: {
        delegate: undefined,
        delegated: false,
        frozen: false,
        owner,
        ownership_model: OwnershipModel.SINGLE,
      },
    })),
    limit: 10,
    total: 10,
  };
}
