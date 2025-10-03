import { isSolanaAddress } from "@dex-web/utils";
import { z } from "zod";

const numericString = z
  .string()
  .refine((v) => v.trim().length > 0, "Value is required")
  .refine((v) => /^\d*(?:\.\d+)?$/.test(v), "Invalid number format");
const base64String = z
  .string()
  .refine((v) => /^[A-Za-z0-9+/=]+$/.test(v), "Invalid base64 string");

export const submitWithdrawalInputSchema = z.object({
  lpTokenAmount: numericString,
  minTokenXOut: numericString.optional(),
  minTokenYOut: numericString.optional(),
  ownerAddress: z.string().refine(isSolanaAddress, "Invalid owner address"),
  signedTransaction: base64String,
  tokenXMint: z.string().refine(isSolanaAddress, "Invalid tokenX mint"),
  tokenYMint: z.string().refine(isSolanaAddress, "Invalid tokenY mint"),
});

export const submitWithdrawalOutputSchema = z.object({
  error: z.string().optional(),
  signature: z.string().optional(),
  status: z.enum(["confirmed", "submitted"]).optional(),
  success: z.boolean(),
});

export type SubmitWithdrawalInput = z.infer<typeof submitWithdrawalInputSchema>;
export type SubmitWithdrawalOutput = z.infer<
  typeof submitWithdrawalOutputSchema
>;
