import { createPoolTx } from "../procedures/pools/createPoolTx.prodcedure";
import { getAddLiquidityReview } from "../procedures/pools/getAddLiquidityReview.procedure";
import { getLPRate } from "../procedures/pools/getLPRate.procedure";
import { getPinedPool } from "../procedures/pools/getPinedPool.procedure";
import { getPoolDetails } from "../procedures/pools/getPoolDetail.procedure";
import { getSwapDetails } from "../procedures/swaps/getSwapDetails.procedure";
import { getSwapQuote } from "../procedures/swaps/getSwapQuote.procedure";
import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { getTokenPrice } from "../procedures/tokens/getTokenPrice.procedure";
import { getTokens } from "../procedures/tokens/getTokens.procedure";
import { dexGatewayRouter } from "./dex-gateway.router";
import { heliusRouter } from "./helius.router";

export const appRouter = {
  createPoolTx,
  dexGateway: dexGatewayRouter,
  getAddLiquidityReview,
  getLPRate,
  getPinedPool,
  getPoolDetails,
  getSwapDetails,
  getSwapQuote,
  getTokenDetails,
  getTokenPrice,
  getTokens,
  helius: heliusRouter,
};

export type AppRouter = typeof appRouter;
