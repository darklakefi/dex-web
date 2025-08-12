import { checkLiquidityTxStatusHandler } from "../../handlers/pools/checkLiquidityTxStatus.handler";
import { checkLiquidityTxStatusInputSchema } from "../../schemas/pools/checkLiquidityTxStatus.schema";
import { baseProcedure } from "../base.procedure";

export const checkLiquidityTxStatus = baseProcedure
  .input(checkLiquidityTxStatusInputSchema)
  .handler(async ({ input }) => {
    return await checkLiquidityTxStatusHandler(input);
  });
