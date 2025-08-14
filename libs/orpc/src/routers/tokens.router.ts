import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { getTokenPrice } from "../procedures/tokens/getTokenPrice.procedure";
import { getTokens } from "../procedures/tokens/getTokens.procedure";

export const tokensRouter = {
  getTokenDetails,
  getTokenPrice,
  getTokens,
};

export type TokensRouter = typeof tokensRouter;
