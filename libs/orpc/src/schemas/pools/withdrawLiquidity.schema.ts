import { z } from "zod";

export const withdrawLiquidityInputSchema = z.object({
  lpTokenAmount: z.string(),
  minTokenXOut: z.string().optional(),
  minTokenYOut: z.string().optional(),
  ownerAddress: z.string(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const withdrawLiquidityOutputSchema = z.object({
  error: z.string().optional(),
  success: z.boolean(),
  unsignedTransaction: z.string().nullable(),
});

export type WithdrawLiquidityInput = z.infer<
  typeof withdrawLiquidityInputSchema
>;
export type WithdrawLiquidityOutput = z.infer<
  typeof withdrawLiquidityOutputSchema
>;
