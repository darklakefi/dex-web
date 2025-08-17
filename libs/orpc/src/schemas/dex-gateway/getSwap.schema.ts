import { z } from "zod";

// Define the input schema for the ping request
export const getSwapInputSchema = z.object({
  amount_in: z.number(),
  is_swap_x_to_y: z.boolean(),
  min_out: z.number(),
  network: z.number(),
  token_mint_x: z.string(),
  token_mint_y: z.string(),
  tracking_id: z.string().optional(),
  user_address: z.string(),
});

export type GetSwapInput = z.infer<typeof getSwapInputSchema>;

// Define the output schema for the ping response
export const getSwapOutputSchema = z.object({
  success: z.boolean(),
  trackingId: z.string(),
  tradeId: z.string(),
  unsignedTransaction: z.string(),
});

export type GetSwapOutput = z.infer<typeof getSwapOutputSchema>;
