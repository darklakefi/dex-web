import { AnchorProvider } from "@coral-xyz/anchor";
import { Transaction } from "@solana/web3.js";
import { z } from "zod/v4";

export const removeLiquidityTransactionInputSchema = z.object({
  lpTokensToBurn: z.string(),
  minAmountX: z.string(),
  minAmountY: z.string(),
  provider: z.instanceof(AnchorProvider),
  tokenXMint: z.string(),
  tokenXProgramId: z.string(),
  tokenYMint: z.string(),
  tokenYProgramId: z.string(),
  user: z.string(),
});

export const removeLiquidityTransactionOutputSchema = z.object({
  success: z.boolean(),
  transaction: z.instanceof(Transaction).nullable(),
});

export type RemoveLiquidityTransactionInput = z.infer<
  typeof removeLiquidityTransactionInputSchema
>;
export type RemoveLiquidityTransactionOutput = z.infer<
  typeof removeLiquidityTransactionOutputSchema
>;
