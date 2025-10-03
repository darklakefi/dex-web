import { randCurrencySymbol, randNumber, randUuid, seed } from "@ngneat/falso";
import {
  Interface as AssetInterface,
  OwnershipModel,
} from "helius-sdk/types/enums";
import type { GetAssetResponse } from "helius-sdk/types/types";
import { FIXED_SEED } from "./constants";

export function generateMockTokenMetadata(): GetAssetResponse {
  seed(FIXED_SEED);
  return {
    burnt: false,
    id: randUuid(),
    interface: AssetInterface.V1_NFT,
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
