import { z } from "zod/v4";

export const getCustomTokenInputSchema = z.object({
  address: z.string().min(1),
});

export const tokenMetadataSchema = z.object({
  address: z.string(),
  decimals: z.number(),
  logo_uri: z.string().optional(),
  name: z.string(),
  symbol: z.string(),
});

export const getCustomTokenOutputSchema = z.object({
  token_metadata: tokenMetadataSchema.optional(),
});

export type GetCustomTokenInput = z.infer<typeof getCustomTokenInputSchema>;
export type GetCustomTokenOutput = z.infer<typeof getCustomTokenOutputSchema>;
