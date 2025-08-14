import { withdrawLiquidityHandler } from "../../handlers/pools/withdrawLiquidity.handler";
import { withdrawLiquidityInputSchema } from "../../schemas/pools/withdrawLiquidity.schema";
import { baseProcedure } from "../base.procedure";

export const withdrawLiquidity = baseProcedure
  .input(withdrawLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await withdrawLiquidityHandler(input);
  });
