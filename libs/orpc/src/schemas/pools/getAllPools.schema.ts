import { z } from "zod/v4";
import { VALIDATION_CONFIG } from "../../config/constants";
export const getAllPoolsInputSchema = z.object({
  includeEmpty: z.boolean().optional().default(false),
  limit: z
    .number()
    .int()
    .min(1)
    .max(VALIDATION_CONFIG.MAX_POOLS_LIMIT)
    .optional(),
  search: z
    .string()
    .max(VALIDATION_CONFIG.MAX_SEARCH_LENGTH)
    .optional()
    .transform((val) => val?.trim()),
});
export const poolAccountSchema = z.object({
  address: z.string(),
  lockedX: z.string(),
  lockedY: z.string(),
  lpTokenSupply: z.string(),
  protocolFeeX: z.string(),
  protocolFeeY: z.string(),
  tokenXMint: z.string(),
  tokenXSymbol: z.string().optional(),
  tokenYMint: z.string(),
  tokenYSymbol: z.string().optional(),
  userLockedX: z.string(),
  userLockedY: z.string(),
});
export const getAllPoolsOutputSchema = z.object({
  pools: z.array(poolAccountSchema),
  total: z.number(),
});
export type GetAllPoolsInput = z.infer<typeof getAllPoolsInputSchema>;
export type PoolAccountData = z.infer<typeof poolAccountSchema>;
export type GetAllPoolsOutput = z.infer<typeof getAllPoolsOutputSchema>;
