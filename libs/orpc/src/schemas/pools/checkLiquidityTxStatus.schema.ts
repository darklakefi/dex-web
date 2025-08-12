import { z } from "zod";

export const checkLiquidityTxStatusInputSchema = z.object({
  signature: z.string(),
  tracking_id: z.string(),
});

export const checkLiquidityTxStatusOutputSchema = z.object({
  error: z.string().optional(),
  signature: z.string(),
  status: z.enum(["pending", "confirmed", "finalized", "failed"]),
  tracking_id: z.string(),
});

export type CheckLiquidityTxStatusInput = z.infer<
  typeof checkLiquidityTxStatusInputSchema
>;
export type CheckLiquidityTxStatusOutput = z.infer<
  typeof checkLiquidityTxStatusOutputSchema
>;
