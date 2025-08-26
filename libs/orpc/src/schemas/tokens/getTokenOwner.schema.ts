import { z } from "zod/v4";

export const getTokenOwnerInputSchema = z
  .object({
    address: z.string(),
  })
  .strict();

export const getTokenOwnerOutputSchema = z.object({
  owner: z.string(),
});

export type GetTokenOwnerInput = z.infer<typeof getTokenOwnerInputSchema>;
export type GetTokenOwnerOutput = z.infer<typeof getTokenOwnerOutputSchema>;
