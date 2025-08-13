import { getUserLiquidityHandler } from "../../handlers/pools/getUserLiquidity.handler";
import { getUserLiquidityInputSchema } from "../../schemas/pools/getUserLiquidity.schema";
import { baseProcedure } from "../base.procedure";

export const getUserLiquidity = baseProcedure
  .input(getUserLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await getUserLiquidityHandler(input);
  });
