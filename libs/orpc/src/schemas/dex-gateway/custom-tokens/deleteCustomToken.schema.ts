import { z } from "zod/v4";

export const deleteCustomTokenInputSchema = z.object({
  address: z.string().min(1),
});

export const deleteCustomTokenOutputSchema = z.object({
  message: z.string().optional(),
  success: z.boolean(),
});

export type DeleteCustomTokenInput = z.infer<
  typeof deleteCustomTokenInputSchema
>;
export type DeleteCustomTokenOutput = z.infer<
  typeof deleteCustomTokenOutputSchema
>;
