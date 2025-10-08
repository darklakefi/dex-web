import { getTransactionStatusHandler } from "../../handlers/dex-gateway/getTransactionStatus.handler";
import { getTransactionStatusInputSchema } from "../../schemas/dex-gateway/getTransactionStatus.schema";
import { baseProcedure } from "../base.procedure";

export const getTransactionStatus = baseProcedure
  .input(getTransactionStatusInputSchema)
  .handler(async ({ input }) => {
    return await getTransactionStatusHandler(input);
  });
