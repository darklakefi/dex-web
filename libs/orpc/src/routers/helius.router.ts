import { getTokenAccounts } from "../procedures/helius/getTokenAccounts.procedure";
import { searchAssets } from "../procedures/helius/searchAssets.procedure";

export const heliusRouter = {
  getTokenAccounts,
  searchAssets,
};

export type HeliusRouter = typeof heliusRouter;
