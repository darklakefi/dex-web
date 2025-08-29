import { z } from "zod/v4";
import { tokenSchema } from "./token.schema";

export const getTokenMetadataInputSchema = z.object({
  addresses: z.array(z.string()),
  returnAsObject: z.boolean().optional().default(false),
});

export const getTokenMetadataOutputSchema = z
  .array(tokenSchema)
  .or(z.record(z.string(), tokenSchema));

export type GetTokenMetadataInput = z.infer<typeof getTokenMetadataInputSchema>;
export type GetTokenMetadataOutput = z.infer<
  typeof getTokenMetadataOutputSchema
>;
