import { z } from "zod";
import { TradeStatus } from "../../dex-gateway.type";

// Define the input schema for the ping request
export const checkTradeStatusInputSchema = z.object({
  tracking_id: z.string(),
  trade_id: z.string(),
});

export type CheckTradeStatusInput = z.infer<typeof checkTradeStatusInputSchema>;

// Define the output schema for the ping response
export const checkTradeStatusOutputSchema = z.object({
  status: z.nativeEnum(TradeStatus),
  trade_id: z.string(),
});

export type CheckTradeStatusOutput = z.infer<
  typeof checkTradeStatusOutputSchema
>;
