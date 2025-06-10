import z from "zod";
import { baseProcedure } from "../baseProcedure";

const getTokenBalanceInputSchema = z.object({
  address: z.string(),
  ownerAddress: z.string(),
});

export const getTokenBalance = baseProcedure
  .input(getTokenBalanceInputSchema)
  .handler(async ({ input }) => {
    // return await searchAssetsHandler({ input });
  });
