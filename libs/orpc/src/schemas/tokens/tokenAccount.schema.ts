import { z } from "zod/v4";

export const tokenAccountSchema = z.object({
  address: z.string(),
  amount: z.number().int().min(0),
  balance: z.number().int().min(0),
  mint: z.string(),
  symbol: z.string(),
});

export type TokenAccount = z.infer<typeof tokenAccountSchema>;
