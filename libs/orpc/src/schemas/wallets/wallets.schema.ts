import { z } from "zod/v4";

export const createWalletInputSchema = z.object({
  chain: z.string().min(1, "Chain is required"),
  id: z.string().min(1, "ID is required"),
  label: z.string().min(1, "Label is required"),
  wallet_address: z
    .string()
    .min(32, "Wallet address must be at least 32 characters")
    .max(44, "Wallet address must not exceed 44 characters"),
});

export const updateWalletInputSchema = z.object({
  chain: z.string().optional(),
  id: z.string().min(1, "Wallet ID is required"),
  label: z.string().optional(),
  wallet_address: z
    .string()
    .min(32, "Wallet address must be at least 32 characters")
    .max(44, "Wallet address must not exceed 44 characters")
    .optional(),
});

export const walletSchema = z.object({
  chain: z.string(),
  created_at: z.string(),
  id: z.string(),
  label: z.string(),
  updated_at: z.string(),
  wallet_address: z.string(),
});

export type CreateWalletInput = z.infer<typeof createWalletInputSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletInputSchema>;
export type Wallet = z.infer<typeof walletSchema>;
