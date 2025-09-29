import type { RouterClient } from "@orpc/server";
import { appRouter } from "./routers/app.router";

/**
 * Server-side oRPC client for use in Server Actions and server components.
 * This bypasses HTTP and directly invokes the router methods.
 */
function createServerClient(): RouterClient<typeof appRouter> {
  return {
    dexGateway: {
      // Add dexGateway methods as needed
    } as RouterClient<typeof appRouter>["dexGateway"],

    helius: {
      // Add helius methods as needed
    } as RouterClient<typeof appRouter>["helius"],

    liquidity: {
      checkLiquidityTransactionStatus: async (input) => {
        return await appRouter.liquidity.checkLiquidityTransactionStatus.handler({
          input,
          context: { headers: {} }
        });
      },

      createLiquidityTransaction: async (input) => {
        return await appRouter.liquidity.createLiquidityTransaction.handler({
          input,
          context: { headers: {} }
        });
      },

      getAddLiquidityReview: async (input) => {
        return await appRouter.liquidity.getAddLiquidityReview.handler({
          input,
          context: { headers: {} }
        });
      },

      getUserLiquidity: async (input) => {
        return await appRouter.liquidity.getUserLiquidity.handler({
          input,
          context: { headers: {} }
        });
      },

      removeLiquidityTransaction: async (input) => {
        return await appRouter.liquidity.removeLiquidityTransaction.handler({
          input,
          context: { headers: {} }
        });
      },

      submitLiquidityTransaction: async (input) => {
        return await appRouter.liquidity.submitLiquidityTransaction.handler({
          input,
          context: { headers: {} }
        });
      },

      submitWithdrawal: async (input) => {
        return await appRouter.liquidity.submitWithdrawal.handler({
          input,
          context: { headers: {} }
        });
      },

      withdrawLiquidity: async (input) => {
        return await appRouter.liquidity.withdrawLiquidity.handler({
          input,
          context: { headers: {} }
        });
      },
    },

    pools: {
      // Add pools methods as needed
    } as RouterClient<typeof appRouter>["pools"],

    swap: {
      // Add swap methods as needed
    } as RouterClient<typeof appRouter>["swap"],

    tokens: {
      // Add tokens methods as needed
    } as RouterClient<typeof appRouter>["tokens"],

    integrations: {
      // Add integrations methods as needed
    } as RouterClient<typeof appRouter>["integrations"],
  };
}

/**
 * Server-side client instance for oRPC.
 * Use this in Server Actions to call oRPC procedures directly.
 */
export const serverClient = createServerClient();

/**
 * Type-safe server client type
 */
export type ServerClient = typeof serverClient;