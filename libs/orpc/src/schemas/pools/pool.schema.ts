import { z } from "zod/v4";

export const poolSchema = z.object({
  apr: z.number(),
  tokenXMint: z.string(),
  tokenXSymbol: z.string(),
  tokenYMint: z.string(),
  tokenYSymbol: z.string(),
});

export type Pool = z.infer<typeof poolSchema>;
