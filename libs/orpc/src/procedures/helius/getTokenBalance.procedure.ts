import { getTokenBalanceHandler } from "../../handlers/helius/getTokenBalance.handler";
import { getTokenBalanceInputSchema } from "../../schemas/helius/getTokenBalance.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenBalance = baseProcedure
  .input(getTokenBalanceInputSchema)
  .handler(async ({ input }) => {
    console.log({ input });
    return await getTokenBalanceHandler(input);
  })
  .callable();
