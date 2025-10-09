import * as z from "zod";

export const getTransactionStatusInputSchema = z.object({
  trackingId: z.string(),
  tradeId: z.string().optional(),
});

export const transactionStatusSchema = z.object({
  confirmations: z.number(),
  error: z.string().optional(),
  lastUpdate: z.number(),
  signature: z.string(),
  status: z.string(),
});

export type GetTransactionStatusInput = z.infer<
  typeof getTransactionStatusInputSchema
>;
export type GetTransactionStatusOutput = z.infer<
  typeof transactionStatusSchema
>;
