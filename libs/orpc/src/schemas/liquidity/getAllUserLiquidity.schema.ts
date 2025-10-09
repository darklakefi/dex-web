import * as z from "zod";

export const getAllUserLiquidityInputSchema = z.object({
  ownerAddress: z.string(),
});

export const userLiquidityPositionSchema = z.object({
  decimals: z.number(),
  hasLiquidity: z.boolean(),
  lpTokenBalance: z.number(),
  lpTokenMint: z.string(),
  poolAddress: z.string().optional(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getAllUserLiquidityOutputSchema = z.object({
  positions: z.array(userLiquidityPositionSchema),
  totalPositions: z.number(),
});

export type GetAllUserLiquidityInput = z.infer<
  typeof getAllUserLiquidityInputSchema
>;
export type UserLiquidityPosition = z.infer<typeof userLiquidityPositionSchema>;
export type GetAllUserLiquidityOutput = z.infer<
  typeof getAllUserLiquidityOutputSchema
>;
