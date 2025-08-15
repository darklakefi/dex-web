import { z } from "zod/v4";

export const getAddLiquidityReviewInputSchema = z.object({
  isTokenX: z.boolean(),
  tokenAmount: z.float64().positive(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getAddLiquidityReviewOutputSchema = z.object({
  tokenAmount: z.float64().positive(),
  tokenAmountRaw: z.string(),
});

export type GetAddLiquidityReviewInput = z.infer<
  typeof getAddLiquidityReviewInputSchema
>;
export type GetAddLiquidityReviewOutput = z.infer<
  typeof getAddLiquidityReviewOutputSchema
>;
