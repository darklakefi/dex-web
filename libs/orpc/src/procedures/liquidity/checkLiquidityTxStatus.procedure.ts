import { checkLiquidityTransactionStatusHandler } from "../../handlers/liquidity/checkLiquidityTransactionStatus.handler";
import { checkLiquidityTransactionStatusInputSchema } from "../../schemas/liquidity/checkLiquidityTransactionStatus.schema";
import { baseProcedure } from "../base.procedure";

export const checkLiquidityTransactionStatus = baseProcedure
  .input(checkLiquidityTransactionStatusInputSchema)
  .handler(async ({ input }) => {
    return await checkLiquidityTransactionStatusHandler(input);
  });
