import { z } from "zod";

export const getTokenMetadataListInputSchema = z.object({
  page_number: z.number(),
  page_size: z.number(),
});

export type GetTokenMetadataListInput = z.infer<
  typeof getTokenMetadataListInputSchema
>;
