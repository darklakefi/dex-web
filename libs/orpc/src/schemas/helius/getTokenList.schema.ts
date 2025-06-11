import { z } from "zod";
import { tokenSchema } from "./token.schema";

export const getTokenListInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const getTokenListOutputSchema = z.array(tokenSchema);

export type GetTokenListInput = z.infer<typeof getTokenListInputSchema>;
export type GetTokenListOutput = z.infer<typeof getTokenListOutputSchema>;
