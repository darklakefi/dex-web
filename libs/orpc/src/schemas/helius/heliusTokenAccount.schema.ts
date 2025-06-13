import { z } from "zod";

export const heliusTokenAccountSchema = z.object({
  address: z.string(),
  amount: z.number().int().min(0),
  mint: z.string(),
});

export type HeliusTokenAccount = z.infer<typeof heliusTokenAccountSchema>;
