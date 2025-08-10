import { z } from "zod";
import { tradeSchema } from "./trade.schema";

export const getTradesListByUserInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  user_address: z.string(),
});

export type GetTradesListByUserInput = z.infer<
  typeof getTradesListByUserInputSchema
>;

export const getTradesListByUserOutputSchema = z.object({
  hasMore: z.boolean(),
  totals: z.number().int().min(0),
  trades: z.array(tradeSchema),
});

export type GetTradesListByUserOutput = z.infer<
  typeof getTradesListByUserOutputSchema
>;
