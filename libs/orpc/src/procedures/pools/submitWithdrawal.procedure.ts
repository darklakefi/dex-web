import { submitWithdrawalHandler } from "../../handlers/pools/submitWithdrawal.handler";
import { submitWithdrawalInputSchema } from "../../schemas/pools/submitWithdrawal.schema";
import { baseProcedure } from "../base.procedure";

export const submitWithdrawal = baseProcedure
  .input(submitWithdrawalInputSchema)
  .handler(async ({ input }) => {
    return await submitWithdrawalHandler(input);
  });
