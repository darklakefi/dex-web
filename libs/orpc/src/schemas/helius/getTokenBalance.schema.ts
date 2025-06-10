import { z } from "zod";

export const getTokenBalanceInputSchema = z.object({
  ownerAddress: z.string(),
});

export type GetTokenBalanceInput = z.infer<typeof getTokenBalanceInputSchema>;
