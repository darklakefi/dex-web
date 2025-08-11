import { z } from "zod/v4";
import { poolSchema } from "./pool.schema";

export const getPinedPoolOutputSchema = z.object({
  featuredPools: z.array(poolSchema),
  trendingPools: z.array(poolSchema),
});
export type GetPinedPoolOutput = z.infer<typeof getPinedPoolOutputSchema>;
