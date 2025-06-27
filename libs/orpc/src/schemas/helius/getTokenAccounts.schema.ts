import { z } from "zod/v4";
import { tokenAccountSchema } from "../tokens/tokenAccount.schema";

export const getTokenAccountsInputSchema = z.object({
  mint: z.string().optional(),
  ownerAddress: z.string(),
});

export const getTokenAccountsOutputSchema = z.object({
  tokenAccounts: z.array(tokenAccountSchema),
});

export type GetTokenAccountsInput = z.infer<typeof getTokenAccountsInputSchema>;

export type GetTokenAccountsOutput = z.infer<
  typeof getTokenAccountsOutputSchema
>;
