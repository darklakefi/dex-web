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

function generateAssetResponseList({
  count = 1,
  fixedSeed = "",
}: {
  count?: number;
  fixedSeed?: string;
}): DAS.GetAssetResponseList {
  seed(fixedSeed);
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
        owner: randUuid(),
        ownership_model: OwnershipModel.SINGLE,
      },
    })),
    limit: count,
    total: count,
  };
}

vi.mock("../../../helius", () => ({
  helius: {
    rpc: {
      searchAssets: vi.fn(() =>
        generateAssetResponseList({
          count: 10,
          fixedSeed: FIXED_SEED,
        }),
      ),
    },
  },
}));
