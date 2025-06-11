import { getTokenBalanceHandler } from "../../handlers/helius/getTokenBalance.handler";
import { getTokenBalanceInputSchema } from "../../schemas/helius/getTokenBalance.schema";
import { baseProcedure } from "../baseProcedure";

export const getTokenBalance = baseProcedure
  .input(getTokenBalanceInputSchema)
  .handler(async ({ input }) => {
    return await getTokenBalanceHandler(input);
  });
