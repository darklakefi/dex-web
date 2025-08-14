import { withdrawLiquidityHandler } from "../../handlers/liquidity/withdrawLiquidity.handler";
import { withdrawLiquidityInputSchema } from "../../schemas/liquidity/withdrawLiquidity.schema";
import { baseProcedure } from "../base.procedure";

export const withdrawLiquidity = baseProcedure
  .input(withdrawLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await withdrawLiquidityHandler(input);
  });
