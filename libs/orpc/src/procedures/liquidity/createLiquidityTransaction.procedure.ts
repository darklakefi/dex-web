import { createLiquidityTransactionHandler } from "../../handlers/liquidity/createLiquidityTransaction.handler";
import { createLiquidityTransactionInputSchema } from "../../schemas/liquidity/createLiquidityTransaction.schema";
import { baseProcedure } from "../base.procedure";

export const createLiquidityTransaction = baseProcedure
  .input(createLiquidityTransactionInputSchema)
  .handler(async ({ input }) => {
    return await createLiquidityTransactionHandler(input);
  });
