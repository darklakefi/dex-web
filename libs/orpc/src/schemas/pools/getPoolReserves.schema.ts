import { z } from "zod";

export const getPoolReservesInputSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getPoolReservesOutputSchema = z.object({
  exists: z.boolean(),
  lpMint: z.string(),
  reserveX: z.number(),
  reserveXRaw: z.number().optional(),
  reserveY: z.number(),
  reserveYRaw: z.number().optional(),
  totalLpSupply: z.number(),
  totalLpSupplyRaw: z.number().optional(),
});

export type GetPoolReservesInput = z.infer<typeof getPoolReservesInputSchema>;
export type GetPoolReservesOutput = z.infer<typeof getPoolReservesOutputSchema>;
