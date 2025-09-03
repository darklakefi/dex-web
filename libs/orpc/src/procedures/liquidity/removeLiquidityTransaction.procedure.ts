import { removeLiquidityTransactionHandler } from "../../handlers/liquidity/removeLiquidityTransaction.handler";
import { removeLiquidityTransactionInputSchema } from "../../schemas/liquidity/removeLiquidityTransaction.schema";
import { baseProcedure } from "../base.procedure";

export const removeLiquidityTransaction = baseProcedure
  .input(removeLiquidityTransactionInputSchema)
  .handler(async ({ input }) => {
    return await removeLiquidityTransactionHandler(input);
  });
