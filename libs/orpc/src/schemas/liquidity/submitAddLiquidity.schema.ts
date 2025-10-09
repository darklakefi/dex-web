import { isSolanaAddress } from "@dex-web/utils";
import * as z from "zod";

const base64String = z
  .string()
  .refine((v) => /^[A-Za-z0-9+/=]+$/.test(v), "Invalid base64 string");

export const submitAddLiquidityInputSchema = z.object({
  signedTransaction: base64String,
  tokenXMint: z.string().refine(isSolanaAddress, "Invalid tokenX mint"),
  tokenYMint: z.string().refine(isSolanaAddress, "Invalid tokenY mint"),
  userAddress: z.string().refine(isSolanaAddress, "Invalid user address"),
});

export const submitAddLiquidityOutputSchema = z.object({
  error: z.string().optional(),
  signature: z.string().optional(),
  status: z.enum(["confirmed", "submitted"]).optional(),
  success: z.boolean(),
});

export type SubmitAddLiquidityInput = z.infer<
  typeof submitAddLiquidityInputSchema
>;
export type SubmitAddLiquidityOutput = z.infer<
  typeof submitAddLiquidityOutputSchema
>;
