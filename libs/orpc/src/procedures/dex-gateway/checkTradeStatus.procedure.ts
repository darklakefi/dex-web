import * as z from "zod";
import { checkTradeStatusHandler } from "../../handlers/dex-gateway/checkTradeStatus.handler";
import { baseProcedure } from "../base.procedure";

const checkTradeStatusInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.CheckTradeStatusRequest")
    .default("darklake.v1.CheckTradeStatusRequest"),
  trackingId: z.string(),
  tradeId: z.string(),
});

export const checkTradeStatus = baseProcedure
  .input(checkTradeStatusInputSchema)
  .handler(async ({ input }) => {
    return await checkTradeStatusHandler(input);
  });
