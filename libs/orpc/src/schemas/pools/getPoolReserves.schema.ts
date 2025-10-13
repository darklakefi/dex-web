import * as z from "zod";

export const getPoolReservesInputSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

/**
 * Validates that a number is finite and non-negative.
 * Critical for financial data to prevent NaN, Infinity, or negative values
 * from corrupting calculations.
 */
const safeFinancialNumber = z
  .number()
  .finite("Value must be finite (not NaN or Infinity)")
  .nonnegative("Financial values must be non-negative");

export const getPoolReservesOutputSchema = z.object({
  exists: z.boolean(),
  lpMint: z.string().min(1, "LP mint address cannot be empty"),
  // Protocol fees must be safe financial numbers
  protocolFeeX: safeFinancialNumber.optional(),
  protocolFeeY: safeFinancialNumber.optional(),
  // Reserves are critical - must be finite and non-negative
  reserveX: safeFinancialNumber,
  // Raw values are returned as strings to preserve precision for BigInt conversion
  // JavaScript numbers lose precision above MAX_SAFE_INTEGER (2^53 - 1)
  reserveXRaw: z.string().optional(),
  reserveY: safeFinancialNumber,
  reserveYRaw: z.string().optional(),
  // LP supply must be safe
  totalLpSupply: safeFinancialNumber,
  totalLpSupplyRaw: z.string().optional(),
  // Total reserves must be safe
  totalReserveXRaw: z.string().optional(),
  totalReserveYRaw: z.string().optional(),
  // Locked amounts must be safe
  userLockedX: safeFinancialNumber.optional(),
  userLockedY: safeFinancialNumber.optional(),
});

export type GetPoolReservesInput = z.infer<typeof getPoolReservesInputSchema>;
export type GetPoolReservesOutput = z.infer<typeof getPoolReservesOutputSchema>;
