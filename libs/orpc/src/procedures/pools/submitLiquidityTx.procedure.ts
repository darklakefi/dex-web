import { submitLiquidityTxHandler } from "../../handlers/pools/submitLiquidityTx.handler";
import { submitLiquidityTxInputSchema } from "../../schemas/pools/submitLiquidityTx.schema";
import { baseProcedure } from "../base.procedure";

export const submitLiquidityTx = baseProcedure
  .input(submitLiquidityTxInputSchema)
  .handler(async ({ input }) => {
    return await submitLiquidityTxHandler(input);
  });
