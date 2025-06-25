import { getTokenBalance } from "../procedures/helius/getTokenBalance.procedure";
import { searchAssets } from "../procedures/helius/searchAssets.procedure";

export const heliusRouter = {
	getTokenBalance,
	searchAssets,
};

export type HeliusRouter = typeof heliusRouter;
