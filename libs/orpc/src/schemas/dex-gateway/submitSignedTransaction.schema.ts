import { z } from "zod";

// Define the input schema for the ping request
export const submitSignedTransactionInputSchema = z.object({
  signed_transaction: z.string(),
  tracking_id: z.string(),
  trade_id: z.string().optional(),
});

export type SubmitSignedTransactionInput = z.infer<
  typeof submitSignedTransactionInputSchema
>;

export const submitSignedTransactionOutputSchema = z.object({
  error_logs: z.string(),
  success: z.boolean(),
  trade_id: z.string().optional(),
});

export type SubmitSignedTransactionOutput = z.infer<
  typeof submitSignedTransactionOutputSchema
>;
