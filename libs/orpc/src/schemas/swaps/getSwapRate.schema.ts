import { z } from "zod/v4";
import { tokenSchema } from "../tokens/token.schema";

export const getSwapRateInputSchema = z.object({
  amountIn: z.float64().positive(),
  isXtoY: z.boolean(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getSwapRateOutputSchema = z.object({
  amountIn: z.float64().positive(),
  amountInRaw: z.string(),
  amountOut: z.float64().positive(),
  amountOutRaw: z.string(),
  estimatedFee: z.string(),
  priceImpact: z.float64(),
  rate: z.float64(),
  tokenX: tokenSchema,
  tokenY: tokenSchema,
});

export type GetSwapRateInput = z.infer<typeof getSwapRateInputSchema>;
export type GetSwapRateOutput = z.infer<typeof getSwapRateOutputSchema>;
