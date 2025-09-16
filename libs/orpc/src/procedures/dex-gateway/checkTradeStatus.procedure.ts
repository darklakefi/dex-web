import { z } from "zod";
import { checkTradeStatusHandler } from "../../handlers/dex-gateway/checkTradeStatus.handler";
import { baseProcedure } from "../base.procedure";

const checkTradeStatusInputSchema = z.object({
  tradeId: z.string(),
});

export const checkTradeStatus = baseProcedure
  .input(checkTradeStatusInputSchema)
  .handler(async ({ input }) => {
    return await checkTradeStatusHandler(input);
  });
