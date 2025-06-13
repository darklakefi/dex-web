import { tokens } from "@dex-web/db/schemas/tokens";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tokenSelectSchema = createSelectSchema(tokens);

export const getTokensInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .strict();

export const getTokensOutputSchema = z.object({
  hasMore: z.boolean(),
  tokens: z.array(tokenSelectSchema),
  total: z.number().int().min(0),
});

export type GetTokensInput = z.infer<typeof getTokensInputSchema>;
export type GetTokensOutput = z.infer<typeof getTokensOutputSchema>;
