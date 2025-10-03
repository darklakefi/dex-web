import { z } from "zod";

export const submitLiquidityTransactionInputSchema = z.object({
  signed_transaction: z.string(),
});

export const submitLiquidityTransactionOutputSchema = z.object({
  error_logs: z.string().optional(),
  error_message: z.string().optional(),
  error_type: z.string().optional(),
  signature: z.string().optional(),
  simulation_error: z.string().optional(),
  success: z.boolean(),
});

export type SubmitLiquidityTransactionInput = z.infer<
  typeof submitLiquidityTransactionInputSchema
>;
export type SubmitLiquidityTransactionOutput = z.infer<
  typeof submitLiquidityTransactionOutputSchema
>;
