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

  // IMPORTANT: validated.poolReserves.reserveX/Y are ALREADY available reserves!
  // The backend already subtracted protocol fees and locked amounts.
  // DO NOT subtract them again or we'll double-subtract!
  const availableReserveX = validated.poolReserves.reserveX;
  const availableReserveY = validated.poolReserves.reserveY;

  console.log("🔧 ===== ADD LIQUIDITY CALCULATION DEBUG =====");
  console.log(
    "📊 Pool Reserves (RAW - already AVAILABLE, fees pre-subtracted):",
    {
      protocolFeeX: validated.poolReserves.protocolFeeX.toString(),
      protocolFeeY: validated.poolReserves.protocolFeeY.toString(),
      reserveX: validated.poolReserves.reserveX.toString(),
      reserveY: validated.poolReserves.reserveY.toString(),
      totalLpSupply: validated.poolReserves.totalLpSupply.toString(),
      userLockedX: validated.poolReserves.userLockedX.toString(),
      userLockedY: validated.poolReserves.userLockedY.toString(),
    },
  );
  console.log("📊 Available reserves (no additional subtraction needed):", {
    availableReserveX: availableReserveX.toString(),
    availableReserveY: availableReserveY.toString(),
  });
  console.log("💰 User Input Amounts (raw):", {
    amountX: amountXRaw.toString(),
    amountY: amountYRaw.toString(),
    decimalsX,
    decimalsY,
  });

  const lpTokensRaw = calculateLpTokensToReceive({
    amountX: amountXRaw,
    amountY: amountYRaw,
    availableReserveX: availableReserveX,
    availableReserveY: availableReserveY,
    totalLpSupply: validated.poolReserves.totalLpSupply,
  });

  console.log("🪙 LP Tokens to receive:", lpTokensRaw.toString());

  // Calculate what Solana will ACTUALLY need using Rust-parity logic (CEILING rounding)
  // This matches add_liquidity.rs lines 139-147
  const lpTokenAmount = BigInt(lpTokensRaw.toString());
  const lpTokenSupply = BigInt(validated.poolReserves.totalLpSupply.toString());
  const reserveXBigInt = BigInt(availableReserveX.toString());
  const reserveYBigInt = BigInt(availableReserveY.toString());

  // Direct port of Rust's lp_tokens_to_trading_tokens with CEILING
  let solanaTokenX = (lpTokenAmount * reserveXBigInt) / lpTokenSupply;
  let solanaTokenY = (lpTokenAmount * reserveYBigInt) / lpTokenSupply;

  // Apply CEILING rounding (add 1 if there's a remainder)
  const tokenXRemainder = (lpTokenAmount * reserveXBigInt) % lpTokenSupply;
  if (tokenXRemainder > 0n && solanaTokenX > 0n) {
    solanaTokenX += 1n;
  }

  const tokenYRemainder = (lpTokenAmount * reserveYBigInt) % lpTokenSupply;
  if (tokenYRemainder > 0n && solanaTokenY > 0n) {
    solanaTokenY += 1n;
  }

  console.log("🔮 Solana will calculate (Rust-parity CEILING):", {
    diffX: (solanaTokenX - amountXRaw).toString(),
    diffY: (solanaTokenY - amountYRaw).toString(),
    tokenX: solanaTokenX.toString(),
    tokenY: solanaTokenY.toString(),
    userProvidedX: amountXRaw.toString(),
    userProvidedY: amountYRaw.toString(),
  });

  // Apply slippage to SOLANA'S calculated amounts, not user input
  // This ensures maxAmounts cover what Solana will actually need
  const solanaTokenXDecimal = new Decimal(solanaTokenX.toString());
  const solanaTokenYDecimal = new Decimal(solanaTokenY.toString());

  const maxAmountXRawWithSlippage = applySlippageToMax(
    solanaTokenXDecimal,
    slippagePercent,
  );
  const maxAmountYRawWithSlippage = applySlippageToMax(
    solanaTokenYDecimal,
    slippagePercent,
  );

  const maxAmountXRaw = BigInt(
    maxAmountXRawWithSlippage.toFixed(0, Decimal.ROUND_UP),
  );
  const maxAmountYRaw = BigInt(
    maxAmountYRawWithSlippage.toFixed(0, Decimal.ROUND_UP),
  );

  console.log("📈 Slippage calculation:", {
    finalMaxAmountX: maxAmountXRaw.toString(),
    finalMaxAmountY: maxAmountYRaw.toString(),
    maxAmountXWithSlippage: maxAmountXRawWithSlippage.toString(),
    maxAmountYWithSlippage: maxAmountYRawWithSlippage.toString(),
    slippagePercent: slippagePercent.toString(),
    solanaCalculatedX: solanaTokenXDecimal.toString(),
    solanaCalculatedY: solanaTokenYDecimal.toString(),
  });
  console.log("⚠️ NOTE: maxAmounts include slippage but NOT transfer fees!");
  console.log("🔧 ===== END DEBUG =====\n");

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
