import { getUserLiquidityHandler } from "../../handlers/liquidity/getUserLiquidity.handler";
import { getUserLiquidityInputSchema } from "../../schemas/pools/getUserLiquidity.schema";
import { baseProcedure } from "../base.procedure";

export const getUserLiquidity = baseProcedure
  .input(getUserLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await getUserLiquidityHandler(input);
  });
