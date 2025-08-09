import { removeLiquidityTxHandler } from "../../handlers/pools/removeLiquidityTx.handler";
import { removeLiquidityTxInputSchema } from "../../schemas/pools/removeLiquidityTx.schema";
import { baseProcedure } from "../base.procedure";

export const removeLiquidity = baseProcedure
  .input(removeLiquidityTxInputSchema)
  .handler(async ({ input }) => {
    return await removeLiquidityTxHandler(input);
  });
