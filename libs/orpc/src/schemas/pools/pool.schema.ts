import { z } from "zod/v4";

export const poolSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export type Pool = z.infer<typeof poolSchema>;
