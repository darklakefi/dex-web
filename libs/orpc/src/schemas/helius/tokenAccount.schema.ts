import { z } from "zod";

export const tokenAccountSchema = z.object({
  address: z.string(),
  amount: z.number().int().min(0),
  mint: z.string(),
});

export type TokenAccount = z.infer<typeof tokenAccountSchema>;
