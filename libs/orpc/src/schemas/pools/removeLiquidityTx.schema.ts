import { AnchorProvider } from "@coral-xyz/anchor";
import { Transaction } from "@solana/web3.js";
import { z } from "zod/v4";

export const removeLiquidityTxInputSchema = z.object({
  lpTokensToBurn: z.number(),
  minAmountX: z.number(),
  minAmountY: z.number(),
  provider: z.instanceof(AnchorProvider),
  tokenXMint: z.string(),
  tokenXProgramId: z.string(),
  tokenYMint: z.string(),
  tokenYProgramId: z.string(),
  user: z.string(),
});

export const removeLiquidityTxOutputSchema = z.object({
  success: z.boolean(),
  transaction: z.instanceof(Transaction).nullable(),
});

export type RemoveLiquidityTxInput = z.infer<
  typeof removeLiquidityTxInputSchema
>;
export type RemoveLiquidityTxOutput = z.infer<
  typeof removeLiquidityTxOutputSchema
>;
