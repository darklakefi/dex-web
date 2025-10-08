import { submitAddLiquidityHandler } from "../../handlers/liquidity/submitAddLiquidity.handler";
import { submitAddLiquidityInputSchema } from "../../schemas/liquidity/submitAddLiquidity.schema";
import { baseProcedure } from "../base.procedure";

export const submitAddLiquidity = baseProcedure
  .input(submitAddLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await submitAddLiquidityHandler(input);
  });
