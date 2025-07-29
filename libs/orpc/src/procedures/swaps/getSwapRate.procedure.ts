import { getSwapRateHandler } from "../../handlers/swaps/getSwapRate.handler";
import { getSwapRateInputSchema } from "../../schemas/swaps/getSwapRate.schema";
import { baseProcedure } from "../base.procedure";

export const getSwapRate = baseProcedure
  .input(getSwapRateInputSchema)
  .handler(async ({ input }) => {
    return await getSwapRateHandler(input);
  });
