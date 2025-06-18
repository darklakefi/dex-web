import { z } from "zod/v4";

export const heliusTokenAccountSchema = z.object({
  address: z.string(),
  amount: z.number().int().min(0),
  mint: z.string(),
});

export type HeliusTokenAccount = z.infer<typeof heliusTokenAccountSchema>;
