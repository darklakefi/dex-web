import { getSwapQuoteHandler } from "../../handlers/swaps/getSwapQuote.handler";
import { getQuoteInputSchema } from "../../schemas/swaps/getQuote.schema";
import { baseProcedure } from "../base.procedure";

export const getSwapQuote = baseProcedure
  .input(getQuoteInputSchema)
  .handler(async ({ input }) => {
    return await getSwapQuoteHandler(input);
  });
