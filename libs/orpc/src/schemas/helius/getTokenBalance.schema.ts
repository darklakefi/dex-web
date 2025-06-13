import { z } from "zod";
import { heliusTokenSchema } from "./heliusToken.schema";
import { heliusTokenAccountSchema } from "./heliusTokenAccount.schema";

export const getTokenBalanceInputSchema = z.object({
  ownerAddress: z.string(),
});

export const getTokenBalanceOutputSchema = z.object({
  assets: z.array(heliusTokenSchema),
  ownerAddress: z.string(),
  tokenAccounts: z.array(heliusTokenAccountSchema),
  total: z.number(),
});

export type GetTokenBalanceInput = z.infer<typeof getTokenBalanceInputSchema>;

export type GetTokenBalanceOutput = z.infer<typeof getTokenBalanceOutputSchema>;
