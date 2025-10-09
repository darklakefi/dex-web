import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { getTokenMetadata } from "../procedures/tokens/getTokenMetadata.procedure";
import { getTokenOwner } from "../procedures/tokens/getTokenOwner.procedure";
import { getTokenPrice } from "../procedures/tokens/getTokenPrice.procedure";
import { getTokens } from "../procedures/tokens/getTokens.procedure";

export const tokensRouter = {
  getTokenDetails,
  getTokenMetadata,
  getTokenOwner,
  getTokenPrice,
  getTokens,
};

export type TokensRouter = typeof tokensRouter;
