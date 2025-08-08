import { Transaction } from "@solana/web3.js";
import { z } from "zod/v4";

export const addLiquidityTxInputSchema = z.object({
  lpTokensToMint: z.number(),
  maxAmountX: z.number(),
  maxAmountY: z.number(),
  tokenXMint: z.string(),
  tokenXProgramId: z.string(),
  tokenYMint: z.string(),
  tokenYProgramId: z.string(),
  user: z.string(),
});

export const addLiquidityTxOutputSchema = z.object({
  success: z.boolean(),
  transaction: z.instanceof(Transaction).nullable(),
});

export type AddLiquidityTxInput = z.infer<typeof addLiquidityTxInputSchema>;
export type AddLiquidityTxOutput = z.infer<typeof addLiquidityTxOutputSchema>;
