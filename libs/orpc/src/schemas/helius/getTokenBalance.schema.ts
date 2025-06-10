import { z } from "zod";
import { tokenSchema } from "./token.schema";
import { tokenAccountSchema } from "./tokenAccount.schema";

export const getTokenBalanceInputSchema = z.object({
  ownerAddress: z.string(),
});

export const getTokenBalanceOutputSchema = z.object({
  assets: z.array(tokenSchema),
  ownerAddress: z.string(),
  tokenAccounts: z.array(tokenAccountSchema),
  total: z.number(),
});

export type GetTokenBalanceInput = z.infer<typeof getTokenBalanceInputSchema>;

export type GetTokenBalanceOutput = z.infer<typeof getTokenBalanceOutputSchema>;
