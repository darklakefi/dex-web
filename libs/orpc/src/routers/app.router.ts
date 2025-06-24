import { getSwapDetails } from "../procedures/swaps/getSwapDetails.procedure";
import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { getTokens } from "../procedures/tokens/getTokens.procedure";
import { heliusRouter } from "./helius.router";

export const appRouter = {
  getSwapDetails,
  getTokenDetails,
  getTokens,
  helius: heliusRouter,
};
