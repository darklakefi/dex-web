import { submitWithdrawalHandler } from "../../handlers/liquidity/submitWithdrawal.handler";
import { submitWithdrawalInputSchema } from "../../schemas/liquidity/submitWithdrawal.schema";
import { baseProcedure } from "../base.procedure";

export const submitWithdrawal = baseProcedure
  .input(submitWithdrawalInputSchema)
  .handler(async ({ input }) => {
    return await submitWithdrawalHandler(input);
  });
