import { Decimal } from "decimal.js";
import { z } from "zod";
import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_DOWN,
});

const solanaAddressSchema = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format");

const numericStringSchema = z.string().refine((val) => {
  const cleaned = val.replace(/,/g, "");
  return !Number.isNaN(Number(cleaned)) && Number(cleaned) > 0;
}, "Must be a valid positive number");

const toBigIntSafe = (fieldName: string) =>
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

const poolReservesSchema = z.object({
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
  slippage: numericStringSchema,
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

function parseAmountSafe(value: string): Decimal {
  const cleaned = value.replace(/,/g, "").trim();
  const decimal = new Decimal(cleaned);

  if (decimal.isNaN() || decimal.lte(0)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return decimal;
}

function toRawUnits(amount: Decimal, decimals: number): bigint {
  const multiplier = new Decimal(10).pow(decimals);
  const rawAmount = amount.mul(multiplier);
  return BigInt(rawAmount.toFixed(0, Decimal.ROUND_DOWN));
}

function _calculateLpTokensToReceive(
  amountX: bigint,
  amountY: bigint,
  reserves: {
    availableReserveX: bigint;
    availableReserveY: bigint;
    totalLpSupply: bigint;
  },
): bigint {
  if (
    reserves.totalLpSupply === BigInt(0) ||
    reserves.availableReserveX === BigInt(0) ||
    reserves.availableReserveY === BigInt(0)
  ) {
    const amountXDecimal = new Decimal(amountX.toString());
    const amountYDecimal = new Decimal(amountY.toString());
    const product = amountXDecimal.mul(amountYDecimal);
    const sqrtProduct = product.sqrt();
    return BigInt(sqrtProduct.toFixed(0, Decimal.ROUND_DOWN));
  }

  const amountXDecimal = new Decimal(amountX.toString());
  const amountYDecimal = new Decimal(amountY.toString());
  const reserveXDecimal = new Decimal(reserves.availableReserveX.toString());
  const reserveYDecimal = new Decimal(reserves.availableReserveY.toString());
  const totalLpSupplyDecimal = new Decimal(reserves.totalLpSupply.toString());

  const lpFromX = amountXDecimal.mul(totalLpSupplyDecimal).div(reserveXDecimal);

  const lpFromY = amountYDecimal.mul(totalLpSupplyDecimal).div(reserveYDecimal);

  const lpTokens = Decimal.min(lpFromX, lpFromY);

  return BigInt(lpTokens.toFixed(0, Decimal.ROUND_DOWN));
}

function calculateAvailableReserves(reserves: {
  reserveX: bigint;
  reserveY: bigint;
  protocolFeeX: bigint;
  protocolFeeY: bigint;
  userLockedX: bigint;
  userLockedY: bigint;
}): { availableReserveX: bigint; availableReserveY: bigint } {
  // Calculate available reserves by subtracting fees and locked amounts
  // This matches the Rust implementation:
  // total_token_x_amount = pool_token_reserve_x.amount - protocol_fee_x - user_locked_x
  const availableReserveX =
    reserves.reserveX - reserves.protocolFeeX - reserves.userLockedX;
  const availableReserveY =
    reserves.reserveY - reserves.protocolFeeY - reserves.userLockedY;

  // Ensure we don't have negative reserves
  if (availableReserveX < BigInt(0) || availableReserveY < BigInt(0)) {
    throw new Error(
      "Available reserves cannot be negative after subtracting fees and locked amounts",
    );
  }

  return {
    availableReserveX,
    availableReserveY,
  };
}

function applySlippageToMax(
  amount: Decimal,
  slippagePercent: Decimal,
): Decimal {
  const slippageFactor = slippagePercent.div(100);
  return amount.mul(new Decimal(1).add(slippageFactor));
}

export function transformAddLiquidityInput(
  input: AddLiquidityInput,
): AddLiquidityPayload {
  const validated = addLiquidityInputSchema.parse(input);

  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    validated.tokenAAddress,
    validated.tokenBAddress,
  );

  const tokenAAmountDecimal = parseAmountSafe(validated.tokenAAmount);
  const tokenBAmountDecimal = parseAmountSafe(validated.tokenBAmount);
  const slippagePercent = parseAmountSafe(validated.slippage);

  let amountXDecimal: Decimal;
  let amountYDecimal: Decimal;
  let decimalsX: number;
  let decimalsY: number;

  if (validated.tokenAAddress === tokenXAddress) {
    amountXDecimal = tokenAAmountDecimal;
    amountYDecimal = tokenBAmountDecimal;
    decimalsX = validated.tokenADecimals;
    decimalsY = validated.tokenBDecimals;
  } else {
    amountXDecimal = tokenBAmountDecimal;
    amountYDecimal = tokenAAmountDecimal;
    decimalsX = validated.tokenBDecimals;
    decimalsY = validated.tokenADecimals;
  }

  const amountXRaw = toRawUnits(amountXDecimal, decimalsX);
  const amountYRaw = toRawUnits(amountYDecimal, decimalsY);

  const { availableReserveX, availableReserveY } = calculateAvailableReserves({
    protocolFeeX: validated.poolReserves.protocolFeeX,
    protocolFeeY: validated.poolReserves.protocolFeeY,
    reserveX: validated.poolReserves.reserveX,
    reserveY: validated.poolReserves.reserveY,
    userLockedX: validated.poolReserves.userLockedX,
    userLockedY: validated.poolReserves.userLockedY,
  });

  const reserveXDecimal = new Decimal(availableReserveX.toString());
  const reserveYDecimal = new Decimal(availableReserveY.toString());
  const totalLpSupplyDecimal = new Decimal(
    validated.poolReserves.totalLpSupply.toString(),
  );

  const amountXDecimalForCalc = new Decimal(amountXRaw.toString());
  const amountYDecimalForCalc = new Decimal(amountYRaw.toString());

  const lpFromX = amountXDecimalForCalc
    .mul(totalLpSupplyDecimal)
    .div(reserveXDecimal);
  const lpFromY = amountYDecimalForCalc
    .mul(totalLpSupplyDecimal)
    .div(reserveYDecimal);

  const lpTokensDecimal = Decimal.min(lpFromX, lpFromY);

  const lpTokensRaw = BigInt(lpTokensDecimal.toFixed(0, Decimal.ROUND_DOWN));

  const userAmountXDecimal = new Decimal(amountXRaw.toString());
  const userAmountYDecimal = new Decimal(amountYRaw.toString());

  const maxAmountXRawWithSlippage = applySlippageToMax(
    userAmountXDecimal,
    slippagePercent,
  );
  const maxAmountYRawWithSlippage = applySlippageToMax(
    userAmountYDecimal,
    slippagePercent,
  );

  const maxAmountXRaw = BigInt(
    maxAmountXRawWithSlippage.toFixed(0, Decimal.ROUND_UP),
  );
  const maxAmountYRaw = BigInt(
    maxAmountYRawWithSlippage.toFixed(0, Decimal.ROUND_UP),
  );

  const payload: AddLiquidityPayload = {
    $typeName: "darklake.v1.AddLiquidityRequest",
    amountLp: lpTokensRaw,
    label: "",
    maxAmountX: maxAmountXRaw,
    maxAmountY: maxAmountYRaw,
    refCode: "",
    tokenMintX: tokenXAddress,
    tokenMintY: tokenYAddress,
    userAddress: validated.userAddress,
  };

  return addLiquidityPayloadSchema.parse(payload);
}
