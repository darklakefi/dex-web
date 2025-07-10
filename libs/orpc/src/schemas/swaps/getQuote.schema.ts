import { SolanaAddressSchema } from "@dex-web/core";
import { z } from "zod/v4";
import { tokenSchema } from "../tokens/token.schema";

export const getQuoteInputSchema = z.object({
  amountIn: z.number().positive(),
  isXtoY: z.boolean(),
  poolAddress: SolanaAddressSchema,
  slippage: z.number().positive(),
  tokenX: SolanaAddressSchema,
  tokenY: SolanaAddressSchema,
});

export const getQuoteOutputSchema = z.object({
  amountOut: z.number().positive(),
  deadline: z.number().positive(),
  estimatedFee: z.number().positive(),
  estimatedFeesUsd: z.number().positive(),
  isXtoY: z.boolean(),
  poolAddress: SolanaAddressSchema,
  priceImpactPercentage: z.number().positive(),
  rateXtoY: z.number().positive(),
  slippage: z.number().positive(),
  tokenX: tokenSchema,
  tokenY: tokenSchema,
  userAddress: SolanaAddressSchema,
});

export type GetQuoteInput = z.infer<typeof getQuoteInputSchema>;
export type GetQuoteOutput = z.infer<typeof getQuoteOutputSchema>;
