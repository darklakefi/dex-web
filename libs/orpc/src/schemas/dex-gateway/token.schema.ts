import { z } from "zod";

export const tokenMetadataSchema = z.object({
  address: z.string(),
  decimals: z.number(),
  logo_uri: z.string(),
  name: z.string(),
  symbol: z.string(),
});

export type TokenMetadata = z.infer<typeof tokenMetadataSchema>;
