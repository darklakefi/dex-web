import { Decimal } from "decimal.js";
import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";
import "./decimalConfig";
import { calculateLpTokensToReceive } from "./liquidityCalculations";
import {
  applySlippageToMax,
  parseAmountSafe,
  toRawUnits,
} from "./liquidityParsers";
import {
  type AddLiquidityInput,
  type AddLiquidityPayload,
  addLiquidityInputSchema,
  addLiquidityPayloadSchema,
} from "./liquiditySchemas";

export {
  type AddLiquidityInput,
  type AddLiquidityPayload,
  addLiquidityInputSchema,
  addLiquidityPayloadSchema,
} from "./liquiditySchemas";

interface TokenMapping {
  readonly amountXDecimal: Decimal;
  readonly amountYDecimal: Decimal;
  readonly decimalsX: number;
  readonly decimalsY: number;
}

/**
 * Map token A/B inputs to sorted X/Y tokens based on address ordering.
 * @internal
 */
function mapTokensToSortedOrder(
  validated: AddLiquidityInput,
  tokenXAddress: string,
  tokenAAmountDecimal: Decimal,
  tokenBAmountDecimal: Decimal,
): TokenMapping {
  if (validated.tokenAAddress === tokenXAddress) {
    return {
      amountXDecimal: tokenAAmountDecimal,
      amountYDecimal: tokenBAmountDecimal,
      decimalsX: validated.tokenADecimals,
      decimalsY: validated.tokenBDecimals,
    };
  }

  return {
    amountXDecimal: tokenBAmountDecimal,
    amountYDecimal: tokenAAmountDecimal,
    decimalsX: validated.tokenBDecimals,
    decimalsY: validated.tokenADecimals,
  };
}

/**
 * Transform user input into a validated AddLiquidityPayload ready for transaction submission.
 *
 * This function:
 * 1. Validates all inputs using Zod schemas
 * 2. Sorts token addresses to maintain X/Y ordering convention
 * 3. Calculates LP tokens to receive based on pool reserves
 * 4. Applies slippage tolerance to create max amounts
 * 5. Returns a validated payload for the protocol
 *
 * @param input - User input for adding liquidity
 * @returns Validated payload ready for transaction submission
 * @throws {Error} If validation fails or calculations produce invalid results
 *
 * @example
 * ```typescript
 * const payload = transformAddLiquidityInput({
 *   tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
 *   tokenAAmount: "100",
 *   tokenADecimals: 6,
 *   tokenBAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
 *   tokenBAmount: "200",
 *   tokenBDecimals: 6,
 *   slippage: "0.5",
 *   poolReserves: {
 *     reserveX: 1000000000n,
 *     reserveY: 2000000000n,
 *     totalLpSupply: 1414213562n,
 *     protocolFeeX: 0n,
 *     protocolFeeY: 0n,
 *     userLockedX: 0n,
 *     userLockedY: 0n,
 *   },
 *   userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
 * });
 * ```
 */
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

  const { amountXDecimal, amountYDecimal, decimalsX, decimalsY } =
    mapTokensToSortedOrder(
      validated,
      tokenXAddress,
      tokenAAmountDecimal,
      tokenBAmountDecimal,
    );

  const amountXRaw = toRawUnits(amountXDecimal, decimalsX);
  const amountYRaw = toRawUnits(amountYDecimal, decimalsY);

  const lpTokensRaw = calculateLpTokensToReceive({
    amountX: amountXRaw,
    amountY: amountYRaw,
    availableReserveX: validated.poolReserves.reserveX,
    availableReserveY: validated.poolReserves.reserveY,
    totalLpSupply: validated.poolReserves.totalLpSupply,
  });

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
