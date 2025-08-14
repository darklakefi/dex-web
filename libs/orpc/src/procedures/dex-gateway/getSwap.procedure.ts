import { getSwapHandler } from "../../handlers/dex-gateway/getSwap.handler";
import { getSwapInputSchema } from "../../schemas/dex-gateway/getSwap.schema";
import { baseProcedure } from "../base.procedure";

export const getSwap = baseProcedure
  .input(getSwapInputSchema)
  .handler(async ({ input }) => {
    return await getSwapHandler(input);
  });
