import { getTokenAccountsHandler } from "../../handlers/helius/getTokenAccounts.handler";
import { getTokenAccountsInputSchema } from "../../schemas/helius/getTokenAccounts.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenAccounts = baseProcedure
  .input(getTokenAccountsInputSchema)
  .handler(async ({ input }) => {
    return await getTokenAccountsHandler(input);
  });
