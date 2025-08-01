import { z } from "zod/v4";
import { tokenSchema } from "../tokens";

export const getQuoteInputSchema = z.object({
  amountIn: z.number().positive(),
  isXtoY: z.boolean(),
  slippage: z.number().positive(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

export const getQuoteOutputSchema = z.object({
  amountIn: z.number().positive(),
  amountInRaw: z.number().positive(),
  amountOut: z.number().positive(),
  amountOutRaw: z.number().positive(),
  estimatedFee: z.number().positive(),
  estimatedFeesUsd: z.number().positive(),
  isXtoY: z.boolean(),
  priceImpactPercentage: z.number().positive(),
  rate: z.number().positive(),
  routePlan: z.array(
    z.object({
      amountIn: z.number().positive(),
      amountOut: z.number().positive(),
      feeAmount: z.number().positive(),
      tokenXMint: z.string(),
      tokenYMint: z.string(),
    }),
  ),
  slippage: z.number().positive(),
  tokenX: tokenSchema,
  tokenXMint: z.string(),
  tokenY: tokenSchema,
  tokenYMint: z.string(),
});

export type GetQuoteInput = z.infer<typeof getQuoteInputSchema>;
export type GetQuoteOutput = z.infer<typeof getQuoteOutputSchema>;
