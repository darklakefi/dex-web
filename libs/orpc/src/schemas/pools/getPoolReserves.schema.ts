import * as z from "zod";

export const getPoolReservesInputSchema = z.object({
  tokenXMint: z.string(),
  tokenYMint: z.string(),
});

const safeFinancialNumber = z
  .number()
  .finite("Value must be finite (not NaN or Infinity)")
  .nonnegative("Financial values must be non-negative");

export const getPoolReservesOutputSchema = z.object({
  exists: z.boolean(),
  lpMint: z.string(),
  protocolFeeX: safeFinancialNumber.optional(),
  protocolFeeY: safeFinancialNumber.optional(),
  reserveX: safeFinancialNumber,
  reserveXRaw: z.string().optional(),
  reserveY: safeFinancialNumber,
  reserveYRaw: z.string().optional(),
  totalLpSupply: safeFinancialNumber,
  totalLpSupplyRaw: z.string().optional(),
  totalReserveXRaw: z.string().optional(),
  totalReserveYRaw: z.string().optional(),
  userLockedX: safeFinancialNumber.optional(),
  userLockedY: safeFinancialNumber.optional(),
});

export type GetPoolReservesInput = z.infer<typeof getPoolReservesInputSchema>;
export type GetPoolReservesOutput = z.infer<typeof getPoolReservesOutputSchema>;
