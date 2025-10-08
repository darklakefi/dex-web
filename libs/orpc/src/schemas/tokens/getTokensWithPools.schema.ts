import { z } from "zod/v4";
import { tokenSchema } from "./token.schema";

export const getTokensWithPoolsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
    onlyWithPools: z.boolean().default(false),
    query: z.string().optional().default(""),
  })
  .strict();

export const getTokensWithPoolsOutputSchema = z.object({
  hasMore: z.boolean(),
  poolTokenAddresses: z.array(z.string()),
  tokens: z.array(tokenSchema),
  total: z.number().int().min(0),
});

export type GetTokensWithPoolsInput = z.infer<
  typeof getTokensWithPoolsInputSchema
>;
export type GetTokensWithPoolsOutput = z.infer<
  typeof getTokensWithPoolsOutputSchema
>;
