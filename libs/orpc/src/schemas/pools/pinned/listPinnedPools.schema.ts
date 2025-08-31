import { z } from "zod/v4";
import { pinnedPoolSchema } from "./pinnedPool.schema";

export const listPinnedPoolsOutputSchema = z.object({
  items: z.array(pinnedPoolSchema),
});

export type ListPinnedPoolsOutput = z.infer<typeof listPinnedPoolsOutputSchema>;
