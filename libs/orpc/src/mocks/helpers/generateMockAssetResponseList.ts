import {
  randProductDescription,
  randProductName,
  randUuid,
  seed,
} from "@ngneat/falso";
import { type DAS, Interface, OwnershipModel } from "helius-sdk";
import { times } from "remeda";
import { FIXED_SEED } from "./constants";

export function generateAssetResponseList({
  count = 10,
}: {
  count?: number;
} = {}): DAS.GetAssetResponseList {
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
      interface: Interface.V1NFT,
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
