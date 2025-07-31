import { z } from "zod/v4";
import { poolSchema } from "./pool.schema";

export const getPoolDetailsInputSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getPoolDetailsOutputSchema = poolSchema;

export type GetPoolDetailsInput = z.infer<typeof getPoolDetailsInputSchema>;
export type GetPoolDetailsOutput = z.infer<typeof getPoolDetailsOutputSchema>;
