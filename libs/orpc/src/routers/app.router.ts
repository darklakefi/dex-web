import { getSwapDetails } from "../procedures/swaps/getSwapDetails.procedure";
import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { getTokenPrice } from "../procedures/tokens/getTokenPrice.procedure";
import { getTokens } from "../procedures/tokens/getTokens.procedure";
import { heliusRouter } from "./helius.router";

export const appRouter = {
  getSwapDetails,
  getTokenDetails,
  getTokenPrice,
  getTokens,
  helius: heliusRouter,
};

export type AppRouter = typeof appRouter;
