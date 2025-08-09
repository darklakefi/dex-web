import { addLiquidityTxHandler } from "../../handlers/pools/addLiquidityTx.handler";
import { addLiquidityTxInputSchema } from "../../schemas/pools/addLiquidityTx.schema";
import { baseProcedure } from "../base.procedure";

export const addLiquidity = baseProcedure
  .input(addLiquidityTxInputSchema)
  .handler(async ({ input }) => {
    return await addLiquidityTxHandler(input);
  });
