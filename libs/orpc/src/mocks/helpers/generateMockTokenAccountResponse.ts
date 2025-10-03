import { randNumber, randUuid, seed } from "@ngneat/falso";
import type { GetTokenAccountsResponse } from "helius-sdk/types/das";
import {
  Interface as AssetInterface,
  OwnershipModel,
} from "helius-sdk/types/enums";
import { times } from "remeda";
import { FIXED_SEED } from "./constants";

export function generateTokenAccountsResponseList({
  count = 10,
}: {
  count?: number;
} = {}): GetTokenAccountsResponse {
  seed(FIXED_SEED);
  return {
    limit: 10,
    token_accounts: times(count, (_i) => ({
      address: randUuid(),
      amount: randNumber({ max: 1000000, min: 1 }),
      id: randUuid(),
      interface: AssetInterface.V1_NFT,
      mint: randUuid(),
      mutable: true,
      ownership: {
        delegate: undefined,
        delegated: false,
        frozen: false,
        owner: randUuid(),
        ownership_model: OwnershipModel.SINGLE,
      },
      token_extensions: [],
    })),
    total: 10,
  };
}
