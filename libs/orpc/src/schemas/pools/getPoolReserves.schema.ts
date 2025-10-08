import { z } from "zod";

export const getPoolReservesInputSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getPoolReservesOutputSchema = z.object({
  exists: z.boolean(),
  lpMint: z.string(),
  reserveX: z.number(), // Available reserve X in human-readable units (for display)
  reserveXRaw: z.number().optional(), // AVAILABLE reserve X in raw units (matches add_liquidity.rs:149)
  reserveY: z.number(), // Available reserve Y in human-readable units (for display)
  reserveYRaw: z.number().optional(), // AVAILABLE reserve Y in raw units (matches add_liquidity.rs:155)
  totalLpSupply: z.number(),
  totalLpSupplyRaw: z.number().optional(), // Total LP supply in raw units (for LP calculations)
});

export type GetPoolReservesInput = z.infer<typeof getPoolReservesInputSchema>;
export type GetPoolReservesOutput = z.infer<typeof getPoolReservesOutputSchema>;
