import { z } from "zod";

export const checkLiquidityTransactionStatusInputSchema = z.object({
  signature: z.string(),
});

export const checkLiquidityTransactionStatusOutputSchema = z.object({
  error: z.string().optional(),
  signature: z.string(),
  status: z.enum(["pending", "confirmed", "finalized", "failed"]),
});

export type CheckLiquidityTransactionStatusInput = z.infer<
  typeof checkLiquidityTransactionStatusInputSchema
>;
export type CheckLiquidityTransactionStatusOutput = z.infer<
  typeof checkLiquidityTransactionStatusOutputSchema
>;
