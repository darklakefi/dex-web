import { z } from "zod/v4";

export const addLiquidityTxInputSchema = z.object({
  maxAmountX: z.union([z.string(), z.number(), z.bigint()]),
  maxAmountY: z.union([z.string(), z.number(), z.bigint()]),
  slippage: z.number(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
  user: z.string(),
});

export const addLiquidityTxOutputSchema = z.object({
  error: z.string().optional(),
  success: z.boolean(),
  transaction: z.string().nullable(),
});

export type AddLiquidityTxInput = z.infer<typeof addLiquidityTxInputSchema>;
export type AddLiquidityTxOutput = z.infer<typeof addLiquidityTxOutputSchema>;
