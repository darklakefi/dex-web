import { z } from "zod/v4";

export const createLiquidityTransactionInputSchema = z.object({
  maxAmountX: z.union([z.string(), z.number(), z.bigint()]),
  maxAmountY: z.union([z.string(), z.number(), z.bigint()]),
  slippage: z.number(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
  user: z.string(),
});

export const createLiquidityTransactionOutputSchema = z.object({
  error: z.string().optional(),
  success: z.boolean(),
  transaction: z.string().nullable(),
});

export type CreateLiquidityTransactionInput = z.infer<
  typeof createLiquidityTransactionInputSchema
>;
export type CreateLiquidityTransactionOutput = z.infer<
  typeof createLiquidityTransactionOutputSchema
>;
