import { z } from "zod";

export const getPoolReservesInputSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getPoolReservesOutputSchema = z.object({
  exists: z.boolean(),
  lpMint: z.string(),
  protocolFeeX: z.number().optional(),
  protocolFeeXRaw: z.union([z.number(), z.string()]).optional(),
  protocolFeeY: z.number().optional(),
  protocolFeeYRaw: z.union([z.number(), z.string()]).optional(),
  reserveX: z.number(),
  reserveXRaw: z.union([z.number(), z.string()]).optional(),
  reserveY: z.number(),
  reserveYRaw: z.union([z.number(), z.string()]).optional(),
  totalLpSupply: z.number(),
  totalLpSupplyRaw: z.union([z.number(), z.string()]).optional(),
  totalReserveXRaw: z.union([z.number(), z.string()]).optional(),
  totalReserveYRaw: z.union([z.number(), z.string()]).optional(),
  userLockedX: z.number().optional(),
  userLockedXRaw: z.union([z.number(), z.string()]).optional(),
  userLockedY: z.number().optional(),
  userLockedYRaw: z.union([z.number(), z.string()]).optional(),
});

export type GetPoolReservesInput = z.infer<typeof getPoolReservesInputSchema>;
export type GetPoolReservesOutput = z.infer<typeof getPoolReservesOutputSchema>;
