import { getTokenBalanceHandler } from "@/handlers/helius/getTokenBalance.handler";
import { baseProcedure } from "@/procedures/baseProcedure";
import { getTokenBalanceInputSchema } from "@/schemas/helius/getTokenBalance.schema";

export const getTokenBalance = baseProcedure
  .input(getTokenBalanceInputSchema)
  .handler(async ({ input }) => {
    return await getTokenBalanceHandler(input);
  });
