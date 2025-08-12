import { z } from "zod/v4";

export const addLiquidityTxInputSchema = z.object({
  lpTokensToMint: z.union([z.string(), z.number(), z.bigint()]),
  maxAmountX: z.union([z.string(), z.number(), z.bigint()]),
  maxAmountY: z.union([z.string(), z.number(), z.bigint()]),
  tokenXMint: z.string(),
  tokenXProgramId: z.string().optional(),
  tokenYMint: z.string(),
  tokenYProgramId: z.string().optional(),
  trackingId: z.string(),
  user: z.string(),
});

export const addLiquidityTxOutputSchema = z.object({
  error: z.string().optional(),
  success: z.boolean(),
  trackingId: z.string(),
  tradeId: z.string(),
  transaction: z.string().nullable(),
});

export type AddLiquidityTxInput = z.infer<typeof addLiquidityTxInputSchema>;
export type AddLiquidityTxOutput = z.infer<typeof addLiquidityTxOutputSchema>;
