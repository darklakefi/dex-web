import { randNumber, randUuid, seed } from "@ngneat/falso";
import { type DAS, Interface, OwnershipModel } from "helius-sdk";
import { times } from "remeda";
import { FIXED_SEED } from "./constants";

export function generateTokenAccountsResponseList({
  count = 10,
}: {
  count?: number;
} = {}): DAS.GetTokenAccountsResponse {
  seed(FIXED_SEED);
  return {
    limit: 10,
    token_accounts: times(count, (_i) => ({
      address: randUuid(),
      amount: randNumber({ max: 1000000, min: 1 }),
      id: randUuid(),
      interface: Interface.V1NFT,
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
