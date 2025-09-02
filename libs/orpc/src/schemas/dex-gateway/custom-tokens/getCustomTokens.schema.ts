import { z } from "zod/v4";
import { tokenMetadataSchema } from "./getCustomToken.schema";

export const getCustomTokensOutputSchema = z.object({
  tokens: z.array(tokenMetadataSchema),
});

export type GetCustomTokensOutput = z.infer<typeof getCustomTokensOutputSchema>;
