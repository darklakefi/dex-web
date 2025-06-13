import { z } from "zod/v4";
import { heliusTokenSchema } from "./heliusToken.schema";

export const searchAssetsInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const searchAssetsOutputSchema = z.array(heliusTokenSchema);

export type SearchAssetsInput = z.infer<typeof searchAssetsInputSchema>;
export type SearchAssetsOutput = z.infer<typeof searchAssetsOutputSchema>;
