import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { getTokenMetadata } from "../procedures/tokens/getTokenMetadata.procedure";
import { getTokenPrice } from "../procedures/tokens/getTokenPrice.procedure";
import { getTokens } from "../procedures/tokens/getTokens.procedure";

export const tokensRouter = {
  getTokenDetails,
  getTokenMetadata,
  getTokenPrice,
  getTokens,
};

export type TokensRouter = typeof tokensRouter;
