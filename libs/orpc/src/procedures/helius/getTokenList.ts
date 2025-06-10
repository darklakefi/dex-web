import { getTokenListHandler } from "@/handlers/helius/getTokenList.handler";
import { baseProcedure } from "@/procedures/baseProcedure";
import { getTokenListInputSchema } from "@/schemas/helius/getTokenList.schema";

export const getTokenList = baseProcedure
  .input(getTokenListInputSchema)
  .handler(async ({ input }) => {
    return await getTokenListHandler(input);
  });
