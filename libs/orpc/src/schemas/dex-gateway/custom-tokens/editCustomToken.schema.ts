import { z } from "zod/v4";

export const editCustomTokenInputSchema = z.object({
  address: z.string().min(1),
  decimals: z.number().int().nonnegative().optional(),
  logo_uri: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  symbol: z.string().min(1).optional(),
});

export const editCustomTokenOutputSchema = z.object({
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

export type EditCustomTokenInput = z.infer<typeof editCustomTokenInputSchema>;
export type EditCustomTokenOutput = z.infer<typeof editCustomTokenOutputSchema>;
