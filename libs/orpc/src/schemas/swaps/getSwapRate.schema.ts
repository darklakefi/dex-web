import { z } from "zod/v4";
import { tokenSchema } from "../tokens/token.schema";

export const getSwapRateInputSchema = z.object({
  amountIn: z.number().positive(),
  isXtoY: z.boolean(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getSwapRateOutputSchema = z.object({
  amountIn: z.number().positive(),
  amountInRaw: z.number().positive(),
  amountOut: z.number().positive(),
  amountOutRaw: z.number().positive(),
  estimatedFee: z.number().positive(),
  rateXtoY: z.number().positive(),
  tokenX: tokenSchema,
  tokenY: tokenSchema,
});

export type GetSwapRateInput = z.infer<typeof getSwapRateInputSchema>;
export type GetSwapRateOutput = z.infer<typeof getSwapRateOutputSchema>;
