import {
  randProductDescription,
  randProductName,
  randUuid,
  seed
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
  fixedSeed?: string
}): DAS.GetAssetResponseList {
      seed(fixedSeed);
      return {
        items: times(count, (i) => ({
          id: randUuid(),
          mutable: true,
          burnt: false,
          interface: Interface.V1NFT,
          ownership: {
            ownership_model: OwnershipModel.SINGLE,
            owner: randUuid(),
            frozen: false,
            delegated: false,
            delegate: undefined,
          },
          content: {
            $schema: "https://schema.dexscreener.com/asset.schema.json",
            json_uri: "https://schema.dexscreener.com/asset.schema.json",
              metadata: {
              name: randProductName(),
            description: randProductDescription(),
            symbol: randProductName().slice(0, 3).toUpperCase(),
          },
        },
			}),
		),
		total: count,
		limit: count,
		cursor: "123",
	};
}

vi.mock("../../../helius", () => ({
	helius: {
		rpc: {
			searchAssets: vi.fn(
				() =>
					generateAssetResponseList({
						count: 10,
						fixedSeed: FIXED_SEED,
					}),
			),
		},
	},
}));
