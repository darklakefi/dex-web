import { getTokenPriceHandler } from "../../handlers/tokens/getTokenPrice.handler";
import { getTokenPriceInputSchema } from "../../schemas/tokens/getTokenPrice.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenPrice = baseProcedure
  .input(getTokenPriceInputSchema)
  .handler(async ({ input }) => {
    return await getTokenPriceHandler(input);
  });
