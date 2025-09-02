import { z } from "zod/v4";

export const pinnedPoolSchema = z.object({
  apr: z.number().default(0),
  chain: z.string().min(1, "Chain is required"),
  created_at: z.string().optional(),
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  tokenXMint: z
    .string()
    .min(32, "tokenXMint must be at least 32 characters")
    .max(44, "tokenXMint must not exceed 44 characters"),
  tokenXSymbol: z.string().min(1, "tokenXSymbol is required"),
  tokenYMint: z
    .string()
    .min(32, "tokenYMint must be at least 32 characters")
    .max(44, "tokenYMint must not exceed 44 characters"),
  tokenYSymbol: z.string().min(1, "tokenYSymbol is required"),
  updated_at: z.string().optional(),
});

export type PinnedPool = z.infer<typeof pinnedPoolSchema>;
