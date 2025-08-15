import { z } from "zod";
import { TradeStatus } from "../../dex-gateway.type";

export const checkTradeStatusInputSchema = z.object({
  tracking_id: z.string(),
  trade_id: z.string(),
});

export type CheckTradeStatusInput = z.infer<typeof checkTradeStatusInputSchema>;

export const checkTradeStatusOutputSchema = z.object({
  status: z.nativeEnum(TradeStatus),
  trade_id: z.string(),
});

export type CheckTradeStatusOutput = z.infer<
  typeof checkTradeStatusOutputSchema
>;
