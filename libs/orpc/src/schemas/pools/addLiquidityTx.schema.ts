import { z } from "zod/v4";

export const addLiquidityTxInputSchema = z.object({
  lpTokensToMint: z.number(),
  maxAmountX: z.number(),
  maxAmountY: z.number(),
  tokenXMint: z.string(),
  tokenXProgramId: z.string(),
  tokenYMint: z.string(),
  tokenYProgramId: z.string(),
  trackingId: z.string(),
  user: z.string(),
});

export const addLiquidityTxOutputSchema = z.object({
  success: z.boolean(),
  trackingId: z.string(),
  transaction: z.string().nullable(),
});

export type AddLiquidityTxInput = z.infer<typeof addLiquidityTxInputSchema>;
export type AddLiquidityTxOutput = z.infer<typeof addLiquidityTxOutputSchema>;
