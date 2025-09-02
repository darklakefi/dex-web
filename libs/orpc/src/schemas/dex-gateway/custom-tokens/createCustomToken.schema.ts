import { z } from "zod/v4";

export const createCustomTokenInputSchema = z.object({
  address: z.string().min(1),
  decimals: z.number().int().nonnegative(),
  logo_uri: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
});

export const createCustomTokenOutputSchema = z.object({
  message: z.string().optional(),
  success: z.boolean(),
  token_metadata: z
    .object({
      address: z.string(),
      decimals: z.number(),
      logo_uri: z.string().optional(),
      name: z.string(),
      symbol: z.string(),
    })
    .optional(),
});

export type CreateCustomTokenInput = z.infer<
  typeof createCustomTokenInputSchema
>;
export type CreateCustomTokenOutput = z.infer<
  typeof createCustomTokenOutputSchema
>;
