import { z } from "zod/v4";
import { swapSchema } from "./swap.schema";

export const getSwapDetailsInputSchema = z.object({
  swapId: z.string(),
});

export const getSwapDetailsOutputSchema = swapSchema;

export type GetSwapDetailsInput = z.infer<typeof getSwapDetailsInputSchema>;
export type GetSwapDetailsOutput = z.infer<typeof getSwapDetailsOutputSchema>;
