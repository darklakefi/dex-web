import { submitSignedTransactionHandler } from "../../handlers/dex-gateway/submitSignedTransaction.handler";
import { submitSignedTransactionInputSchema } from "../../schemas/dex-gateway/submitSignedTransaction.schema";
import { baseProcedure } from "../base.procedure";

// Create the ping procedure
export const submitSignedTransaction = baseProcedure
  .input(submitSignedTransactionInputSchema)
  .handler(async ({ input }) => {
    return await submitSignedTransactionHandler(input);
  });
