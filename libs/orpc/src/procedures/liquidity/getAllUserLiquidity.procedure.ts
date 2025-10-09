import { getAllUserLiquidityHandler } from "../../handlers/liquidity/getAllUserLiquidity.handler";
import { getAllUserLiquidityInputSchema } from "../../schemas/liquidity/getAllUserLiquidity.schema";
import { baseProcedure } from "../base.procedure";

export const getAllUserLiquidity = baseProcedure
  .input(getAllUserLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await getAllUserLiquidityHandler(input);
  });
