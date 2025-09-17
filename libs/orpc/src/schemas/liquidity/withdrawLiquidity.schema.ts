import { z } from "zod";
import { isSolanaAddress } from "@dex-web/utils";

const numericString = z
  .string()
  .refine((v) => v.trim().length > 0, "Value is required")
  .refine((v) => /^\d*(?:\.\d+)?$/.test(v), "Invalid number format");

export const withdrawLiquidityInputSchema = z.object({
  lpTokenAmount: numericString,
  minTokenXOut: numericString.optional(),
  minTokenYOut: numericString.optional(),
  ownerAddress: z.string().refine(isSolanaAddress, "Invalid owner address"),
  tokenXMint: z.string().refine(isSolanaAddress, "Invalid tokenX mint"),
  tokenYMint: z.string().refine(isSolanaAddress, "Invalid tokenY mint"),
});

export const withdrawLiquidityOutputSchema = z.object({
  error: z.string().optional(),
  success: z.boolean(),
  unsignedTransaction: z.string().nullable(),
});

export type WithdrawLiquidityInput = z.infer<
  typeof withdrawLiquidityInputSchema
>;
export type WithdrawLiquidityOutput = z.infer<
  typeof withdrawLiquidityOutputSchema
>;
