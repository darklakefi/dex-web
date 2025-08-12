import { z } from "zod";

export const submitLiquidityTxInputSchema = z.object({
  signed_transaction: z.string(),
  tracking_id: z.string(),
});

export const submitLiquidityTxOutputSchema = z.object({
  error_logs: z.string().optional(),
  signature: z.string().optional(),
  success: z.boolean(),
  tracking_id: z.string(),
});

export type SubmitLiquidityTxInput = z.infer<
  typeof submitLiquidityTxInputSchema
>;
export type SubmitLiquidityTxOutput = z.infer<
  typeof submitLiquidityTxOutputSchema
>;
