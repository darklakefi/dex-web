import { checkTradeStatusHandler } from "../../handlers/dex-gateway/checkTradeStatus.handler";
import { checkTradeStatusInputSchema } from "../../schemas/dex-gateway/checkTradeStatus.schema";
import { baseProcedure } from "../base.procedure";

// Create the ping procedure
export const checkTradeStatus = baseProcedure
  .input(checkTradeStatusInputSchema)
  .handler(async ({ input }) => {
    return await checkTradeStatusHandler(input);
  });
