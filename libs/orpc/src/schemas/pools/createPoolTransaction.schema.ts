import { z } from "zod/v4";

export const createPoolTransactionInputSchema = z.object({
  depositAmountX: z.string(),
  depositAmountY: z.string(),
  tokenXMint: z.string(),
  tokenYMint: z.string(),
  user: z.string(),
});

export const createPoolTransactionOutputSchema = z.object({
  success: z.boolean(),
  transaction: z.string().nullable(),
});

export type CreatePoolTransactionInput = z.infer<
  typeof createPoolTransactionInputSchema
>;
export type CreatePoolTransactionOutput = z.infer<
  typeof createPoolTransactionOutputSchema
>;
