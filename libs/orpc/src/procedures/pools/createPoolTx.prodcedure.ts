import { createPoolTxHandler } from "../../handlers/pools/createPoolTx.handler";
import { createPoolTxInputSchema } from "../../schemas/pools/createPoolTx.schema";
import { baseProcedure } from "../base.procedure";

export const createPoolTx = baseProcedure
  .input(createPoolTxInputSchema)
  .handler(async ({ input }) => {
    return await createPoolTxHandler(input);
  });
