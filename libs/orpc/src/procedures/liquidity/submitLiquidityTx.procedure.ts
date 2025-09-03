import { submitLiquidityTransactionHandler } from "../../handlers/liquidity/submitLiquidityTransaction.handler";
import { submitLiquidityTransactionInputSchema } from "../../schemas/liquidity/submitLiquidityTransaction.schema";
import { baseProcedure } from "../base.procedure";

export const submitLiquidityTransaction = baseProcedure
  .input(submitLiquidityTransactionInputSchema)
  .handler(async ({ input }) => {
    return await submitLiquidityTransactionHandler(input);
  });
