import { z } from "zod";

export const getTokenListInputSchema = z.object({
  input: z.object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
});

export type GetTokenListInput = z.infer<typeof getTokenListInputSchema>;
