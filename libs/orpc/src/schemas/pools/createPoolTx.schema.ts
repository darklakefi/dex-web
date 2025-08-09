import { AnchorProvider } from "@coral-xyz/anchor";
import { Transaction } from "@solana/web3.js";
import { z } from "zod/v4";

export const createPoolTxInputSchema = z.object({
  depositAmountX: z.number(),
  depositAmountY: z.number(),
  provider: z.instanceof(AnchorProvider),
  tokenXMint: z.string(),
  tokenXProgramId: z.string(),
  tokenYMint: z.string(),
  tokenYProgramId: z.string(),
  user: z.string(),
});

export const createPoolTxOutputSchema = z.object({
  success: z.boolean(),
  transaction: z.instanceof(Transaction).nullable(),
});

export type CreatePoolTxInput = z.infer<typeof createPoolTxInputSchema>;
export type CreatePoolTxOutput = z.infer<typeof createPoolTxOutputSchema>;
