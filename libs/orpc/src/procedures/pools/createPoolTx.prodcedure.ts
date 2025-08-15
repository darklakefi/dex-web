import { createPoolTransactionHandler } from "../../handlers/pools/createPoolTransaction.handler";
import { createPoolTransactionInputSchema } from "../../schemas/pools/createPoolTransaction.schema";
import { baseProcedure } from "../base.procedure";

export const createPoolTransaction = baseProcedure
  .input(createPoolTransactionInputSchema)
  .handler(async ({ input }) => {
    return await createPoolTransactionHandler(input);
  });
