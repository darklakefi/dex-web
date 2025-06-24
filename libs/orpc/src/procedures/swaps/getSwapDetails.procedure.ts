import { getSwapDetailsHandler } from "../../handlers/swaps/getSwapDetails.handler";
import { getSwapDetailsInputSchema } from "../../schemas/swaps/getSwapDetails.schema";
import { baseProcedure } from "../base.procedure";

export const getSwapDetails = baseProcedure
  .input(getSwapDetailsInputSchema)
  .handler(async ({ input }) => {
    return await getSwapDetailsHandler(input);
  });
