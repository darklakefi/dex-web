import { z } from "zod/v4";

export const jupiterTokenSchema = z.object({
  address: z.string(),
  chainId: z.number().int().nonnegative(),
  decimals: z.number().int().nonnegative(),
  description: z.string().optional(),
  logo_uri: z.string(),
  name: z.string(),
  symbol: z.string(),
  tags: z.array(z.string()).optional(),
});

export const jupiterTokensResponseSchema = z.array(jupiterTokenSchema);

export type JupiterToken = z.infer<typeof jupiterTokenSchema>;
export type JupiterTokensResponse = z.infer<typeof jupiterTokensResponseSchema>;
