import { z } from "zod";

// Define the input schema for the ping request
export const submitSignedTransactionInputSchema = z.object({
  signed_transaction: z.string(),
  tracking_id: z.string(),
  trade_id: z.string(),
});

export type SubmitSignedTransactionInput = z.infer<
  typeof submitSignedTransactionInputSchema
>;

// Define the output schema for the ping response
export const submitSignedTransactionOutputSchema = z.object({
  success: z.boolean(),
  trade_id: z.string(),
});

export type SubmitSignedTransactionOutput = z.infer<
  typeof submitSignedTransactionOutputSchema
>;
