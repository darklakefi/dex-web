import * as z from "zod";

/**
 * Zod schemas for validating liquidity-related inputs.
 * Extracted for reusability and testability.
 */

export const solanaAddressSchema = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format");

export const numericStringSchema = z.string().refine((val) => {
  const cleaned = val.replace(/,/g, "");
  return !Number.isNaN(Number(cleaned)) && Number(cleaned) > 0;
}, "Must be a valid positive number");

export const numericStringSchemaAllowZero = z.string().refine((val) => {
  const cleaned = val.replace(/,/g, "");
  return !Number.isNaN(Number(cleaned)) && Number(cleaned) >= 0;
}, "Must be a valid non-negative number");

export const toBigIntSafe = (fieldName: string) =>
  z
    .union([z.number().nonnegative(), z.bigint().nonnegative(), z.string()])
    .transform((val) => {
      if (typeof val === "bigint") return val;
      if (typeof val === "string") return BigInt(val);

      if (val > Number.MAX_SAFE_INTEGER) {
        throw new Error(
          `${fieldName} ${val} exceeds safe integer range. Please use bigint or string.`,
        );
      }
      return BigInt(Math.floor(val));
    });

export const poolReservesSchema = z.object({
  lockedX: toBigIntSafe("lockedX").optional().default(BigInt(0)),
  lockedY: toBigIntSafe("lockedY").optional().default(BigInt(0)),
  protocolFeeX: toBigIntSafe("protocolFeeX").optional().default(BigInt(0)),
  protocolFeeY: toBigIntSafe("protocolFeeY").optional().default(BigInt(0)),
  reserveX: toBigIntSafe("reserveX"),
  reserveY: toBigIntSafe("reserveY"),
  totalLpSupply: toBigIntSafe("totalLpSupply"),
  userLockedX: toBigIntSafe("userLockedX").optional().default(BigInt(0)),
  userLockedY: toBigIntSafe("userLockedY").optional().default(BigInt(0)),
});

export const addLiquidityInputSchema = z.object({
  poolReserves: poolReservesSchema,
  slippage: numericStringSchemaAllowZero,
  tokenAAddress: solanaAddressSchema,
  tokenAAmount: numericStringSchema,
  tokenADecimals: z.number().int().min(0).max(18),
  tokenBAddress: solanaAddressSchema,
  tokenBAmount: numericStringSchema,
  tokenBDecimals: z.number().int().min(0).max(18),
  userAddress: solanaAddressSchema,
});

export type AddLiquidityInput = z.infer<typeof addLiquidityInputSchema>;

export const addLiquidityPayloadSchema = z.object({
  $typeName: z.literal("darklake.v1.AddLiquidityRequest").optional(),
  amountLp: z.bigint().positive(),
  label: z.string().default(""),
  maxAmountX: z.bigint().positive(),
  maxAmountY: z.bigint().positive(),
  refCode: z.string().default(""),
  tokenMintX: solanaAddressSchema,
  tokenMintY: solanaAddressSchema,
  userAddress: solanaAddressSchema,
});

export type AddLiquidityPayload = z.infer<typeof addLiquidityPayloadSchema>;
