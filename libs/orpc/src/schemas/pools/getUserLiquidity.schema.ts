import { z } from "zod";

export const getUserLiquidityInputSchema = z.object({
  ownerAddress: z.string(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getUserLiquidityOutputSchema = z.object({
  decimals: z.number(),
  hasLiquidity: z.boolean(),
  lpTokenBalance: z.number(),
  lpTokenMint: z.string(),
});

export type GetUserLiquidityInput = z.infer<typeof getUserLiquidityInputSchema>;
export type GetUserLiquidityOutput = z.infer<
  typeof getUserLiquidityOutputSchema
>;
