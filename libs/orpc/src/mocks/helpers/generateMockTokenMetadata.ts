import { randCurrencySymbol, randNumber, randUuid, seed } from "@ngneat/falso";
import { type DAS, Interface, OwnershipModel } from "helius-sdk";
import { FIXED_SEED } from "./constants";

export function generateMockTokenMetadata(): DAS.GetAssetResponse {
  seed(FIXED_SEED);
  return {
    burnt: false,
    id: randUuid(),
    interface: Interface.V1NFT,
    mutable: true,
    ownership: {
      delegate: undefined,
      delegated: false,
      frozen: true,
      owner: randUuid(),
      ownership_model: OwnershipModel.SINGLE,
    },
    token_info: {
      decimals: randNumber({ max: 9, min: 0 }),
      symbol: randCurrencySymbol(),
    },
  };
}
