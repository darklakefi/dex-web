import { getTokenListHandler } from "../../handlers/helius/getTokenList.handler";
import { getTokenListInputSchema } from "../../schemas/helius/getTokenList.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenList = baseProcedure
  .input(getTokenListInputSchema)
  .handler(async ({ input }) => {
    return await getTokenListHandler(input);
  });
