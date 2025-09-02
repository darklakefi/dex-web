import { dexGatewayRouter } from "./dex-gateway.router";
import { heliusRouter } from "./helius.router";
import { liquidityRouter } from "./liquidity.router";
import { poolsRouter } from "./pools.router";
import { swapRouter } from "./swap.router";
import { tokensRouter } from "./tokens.router";
import { walletsRouter } from "./wallets.router";

export const appRouter = {
  dexGateway: dexGatewayRouter,

  helius: heliusRouter,
  liquidity: liquidityRouter,
  pools: poolsRouter,
  swap: swapRouter,
  tokens: tokensRouter,
  wallets: walletsRouter,
};

export type AppRouter = typeof appRouter;
