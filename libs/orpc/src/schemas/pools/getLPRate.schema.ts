import { z } from "zod/v4";

export const getLPRateInputSchema = z.object({
  slippage: z.float64().min(0).max(100).optional().default(0),
  tokenXAmount: z.float64().positive(),
  tokenXMint: z.string(),
  tokenYAmount: z.float64().positive(),
  tokenYMint: z.string(), // 55.55% (expect two decimal places)
});

export const getLPRateOutputSchema = z.object({
  estimatedLPTokens: z.string(),
});

export type GetLPRateInput = z.infer<typeof getLPRateInputSchema>;
export type GetLPRateOutput = z.infer<typeof getLPRateOutputSchema>;
