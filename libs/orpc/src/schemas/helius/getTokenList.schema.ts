import { z } from "zod";
import { heliusTokenSchema } from "./heliusToken.schema";

export const getTokenListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const getTokenListOutputSchema = z.array(heliusTokenSchema);

export type GetTokenListInput = z.infer<typeof getTokenListInputSchema>;
export type GetTokenListOutput = z.infer<typeof getTokenListOutputSchema>;
