import { z } from "zod";
import { TradeStatus } from "../../dex-gateway.type";
import { tokenMetadataSchema } from "./token.schema";

export const tradeSchema = z.object({
  amount_in: z.number(),
  created_at: z.number(),
  minimal_amount_out: z.number(),
  order_id: z.string(),
  signature: z.string(),
  status: z.nativeEnum(TradeStatus),
  token_x: tokenMetadataSchema,
  token_y: tokenMetadataSchema,
  trade_id: z.string(),
  updated_at: z.number(),
  user_address: z.string(),
});
