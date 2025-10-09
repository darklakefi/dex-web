import { Decimal } from "decimal.js";
import "./decimalConfig";

export interface AvailableReserves {
  readonly availableReserveX: bigint;
  readonly availableReserveY: bigint;
}

export interface PoolReservesInput {
  readonly reserveX: bigint;
  readonly reserveY: bigint;
  readonly protocolFeeX: bigint;
  readonly protocolFeeY: bigint;
  readonly userLockedX: bigint;
  readonly userLockedY: bigint;
}

export interface LpCalculationInput {
  readonly amountX: bigint;
  readonly amountY: bigint;
  readonly availableReserveX: bigint;
  readonly availableReserveY: bigint;
  readonly totalLpSupply: bigint;
}

/**
 * Calculate available reserves by subtracting fees and locked amounts.
 * This matches the Rust implementation:
 * total_token_x_amount = pool_token_reserve_x.amount - protocol_fee_x - user_locked_x
 *
 * @param reserves - Pool reserves with fees and locked amounts
 * @returns Available reserves for calculations
 * @throws {Error} If available reserves would be negative
 */
export function calculateAvailableReserves(
  reserves: PoolReservesInput,
): AvailableReserves {
  const availableReserveX =
    reserves.reserveX - reserves.protocolFeeX - reserves.userLockedX;
  const availableReserveY =
    reserves.reserveY - reserves.protocolFeeY - reserves.userLockedY;

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

/**
 * Calculate LP tokens to receive when adding liquidity.
 * For new pools: returns sqrt(amountX * amountY)
 * For existing pools: returns min(lpFromX, lpFromY) where:
 *   lpFromX = (amountX / reserveX) * totalLpSupply
 *   lpFromY = (amountY / reserveY) * totalLpSupply
 *
 * @param input - Amounts and reserves for LP calculation
 * @returns LP tokens to mint as bigint
 */
export function calculateLpTokensToReceive(input: LpCalculationInput): bigint {
  if (
    input.totalLpSupply === BigInt(0) ||
    input.availableReserveX === BigInt(0) ||
    input.availableReserveY === BigInt(0)
  ) {
    const amountXDecimal = new Decimal(input.amountX.toString());
    const amountYDecimal = new Decimal(input.amountY.toString());
    const product = amountXDecimal.mul(amountYDecimal);
    const sqrtProduct = product.sqrt();
    return BigInt(sqrtProduct.toFixed(0, Decimal.ROUND_DOWN));
  }

  const amountXDecimal = new Decimal(input.amountX.toString());
  const amountYDecimal = new Decimal(input.amountY.toString());
  const reserveXDecimal = new Decimal(input.availableReserveX.toString());
  const reserveYDecimal = new Decimal(input.availableReserveY.toString());
  const totalLpSupplyDecimal = new Decimal(input.totalLpSupply.toString());

  const lpFromX = amountXDecimal.mul(totalLpSupplyDecimal).div(reserveXDecimal);
  const lpFromY = amountYDecimal.mul(totalLpSupplyDecimal).div(reserveYDecimal);

  const lpTokens = Decimal.min(lpFromX, lpFromY);

  return BigInt(lpTokens.toFixed(0, Decimal.ROUND_DOWN));
}
