import { z } from "zod/v4";
import { tokenSchema } from "./token.schema";

export const getTokenDetailsInputSchema = z.object({
  symbol: z.string(),
});

export const getTokenDetailsOutputSchema = tokenSchema;

export type GetTokenDetailsInput = z.infer<typeof getTokenDetailsInputSchema>;
export type GetTokenDetailsOutput = z.infer<typeof getTokenDetailsOutputSchema>;
