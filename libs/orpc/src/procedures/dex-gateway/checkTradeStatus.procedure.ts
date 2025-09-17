import { z } from "zod";
import { checkTradeStatusHandler } from "../../handlers/dex-gateway/checkTradeStatus.handler";
import { baseProcedure } from "../base.procedure";

const checkTradeStatusInputSchema = z.object({
  tradeId: z.string(),
  trackingId: z.string(),
  $typeName: z
    .literal("darklake.v1.CheckTradeStatusRequest")
    .default("darklake.v1.CheckTradeStatusRequest"),
});

export const checkTradeStatus = baseProcedure
  .input(checkTradeStatusInputSchema)
  .handler(async ({ input }) => {
    return await checkTradeStatusHandler(input);
  });
