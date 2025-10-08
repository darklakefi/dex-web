import { Decimal } from "decimal.js";
import { z } from "zod";
import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";

/**
 * Configure Decimal.js for financial precision
 * All monetary calculations MUST use Decimal to avoid floating point errors
 */
Decimal.set({
  precision: 40, // High precision for intermediate calculations
  rounding: Decimal.ROUND_DOWN, // Always round down to prevent overspending
});

/**
 * Solana address validation schema
 */
const solanaAddressSchema = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format");

/**
 * Numeric string schema that validates user input can be parsed
 */
const numericStringSchema = z.string().refine((val) => {
  const cleaned = val.replace(/,/g, "");
  return !Number.isNaN(Number(cleaned)) && Number(cleaned) > 0;
}, "Must be a valid positive number");

/**
 * Converts number, bigint, or string to bigint safely
 * Handles large values that exceed JavaScript's safe integer range
 */
const toBigIntSafe = (fieldName: string) =>
  z
    .union([z.number().nonnegative(), z.bigint().nonnegative(), z.string()])
    .transform((val) => {
      if (typeof val === "bigint") return val;
      if (typeof val === "string") return BigInt(val);
      // For numbers, check if they're in safe range
      if (val > Number.MAX_SAFE_INTEGER) {
        throw new Error(
          `${fieldName} ${val} exceeds safe integer range. Please use bigint or string.`,
        );
      }
      return BigInt(Math.floor(val));
    });

/**
 * Pool reserves schema - raw units from chain
 * Accepts number, bigint, or string to handle large values that exceed safe integer range
 */
const poolReservesSchema = z.object({
  reserveX: toBigIntSafe("reserveX"),
  reserveY: toBigIntSafe("reserveY"),
  totalLpSupply: toBigIntSafe("totalLpSupply"),
});

/**
 * Input schema for add liquidity transformation
 */
export const addLiquidityInputSchema = z.object({
  poolReserves: poolReservesSchema,
  slippage: numericStringSchema,
  tokenAAddress: solanaAddressSchema, // Human-readable amount (e.g., "1.5")
  tokenAAmount: numericStringSchema, // Human-readable amount (e.g., "100")
  tokenADecimals: z.number().int().min(0).max(18), // Percentage (e.g., "0.5" for 0.5%)
  tokenBAddress: solanaAddressSchema, // Token decimals (e.g., 9 for SOL)
  tokenBAmount: numericStringSchema, // Token decimals (e.g., 6 for USDC)
  tokenBDecimals: z.number().int().min(0).max(18),
  userAddress: solanaAddressSchema, // Raw units from blockchain
});

export type AddLiquidityInput = z.infer<typeof addLiquidityInputSchema>;

/**
 * Output payload schema - matches the add_liquidity instruction in IDL
 */
export const addLiquidityPayloadSchema = z.object({
  $typeName: z.literal("darklake.v1.AddLiquidityRequest").optional(),
  amountLp: z.bigint().positive(),
  label: z.string().default(""),
  maxAmountX: z.bigint().positive(), // Desired LP tokens (in raw units)
  maxAmountY: z.bigint().positive(), // Max token X to deposit (slippage protection)
  refCode: z.string().default(""), // Max token Y to deposit (slippage protection)
  tokenMintX: solanaAddressSchema,
  tokenMintY: solanaAddressSchema,
  userAddress: solanaAddressSchema,
});

export type AddLiquidityPayload = z.infer<typeof addLiquidityPayloadSchema>;

/**
 * Parse a string amount, removing commas and validating
 * @throws {Error} if the amount is invalid
 */
function parseAmountSafe(value: string): Decimal {
  const cleaned = value.replace(/,/g, "").trim();
  const decimal = new Decimal(cleaned);

  if (decimal.isNaN() || decimal.lte(0)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return decimal;
}

/**
 * Convert human-readable amount to raw units (scaled by 10^decimals)
 */
function toRawUnits(amount: Decimal, decimals: number): bigint {
  const multiplier = new Decimal(10).pow(decimals);
  const rawAmount = amount.mul(multiplier);
  return BigInt(rawAmount.toFixed(0, Decimal.ROUND_DOWN));
}

/**
 * Calculate LP tokens that will be received for depositing amountX and amountY
 *
 * Formula from constant product AMM:
 * lpToMint = min(amountX * totalLpSupply / reserveX, amountY * totalLpSupply / reserveY)
 *
 * This ensures proportional deposit - the limiting token determines LP amount.
 *
 * @param amountX - Amount of token X in raw units
 * @param amountY - Amount of token Y in raw units
 * @param reserves - Current pool reserves in raw units (bigint for precision)
 * @returns LP tokens to be minted in raw units
 */
function _calculateLpTokensToReceive(
  amountX: bigint,
  amountY: bigint,
  reserves: { reserveX: bigint; reserveY: bigint; totalLpSupply: bigint },
): bigint {
  // Handle empty pool case
  if (
    reserves.totalLpSupply === BigInt(0) ||
    reserves.reserveX === BigInt(0) ||
    reserves.reserveY === BigInt(0)
  ) {
    // For first deposit, use sqrt(amountX * amountY) or return 1 LP token
    // Based on typical AMM initialization
    const amountXDecimal = new Decimal(amountX.toString());
    const amountYDecimal = new Decimal(amountY.toString());
    const product = amountXDecimal.mul(amountYDecimal);
    const sqrtProduct = product.sqrt();
    return BigInt(sqrtProduct.toFixed(0, Decimal.ROUND_DOWN));
  }

  const amountXDecimal = new Decimal(amountX.toString());
  const amountYDecimal = new Decimal(amountY.toString());
  const reserveXDecimal = new Decimal(reserves.reserveX.toString());
  const reserveYDecimal = new Decimal(reserves.reserveY.toString());
  const totalLpSupplyDecimal = new Decimal(reserves.totalLpSupply.toString());

  // Calculate LP tokens from each side
  // lpFromX = (amountX / reserveX) * totalLpSupply
  const lpFromX = amountXDecimal.mul(totalLpSupplyDecimal).div(reserveXDecimal);

  // lpFromY = (amountY / reserveY) * totalLpSupply
  const lpFromY = amountYDecimal.mul(totalLpSupplyDecimal).div(reserveYDecimal);

  // Take minimum to maintain pool ratio (limiting token determines LP amount)
  const lpTokens = Decimal.min(lpFromX, lpFromY);

  return BigInt(lpTokens.toFixed(0, Decimal.ROUND_DOWN));
}

/**
 * Apply slippage tolerance to amounts
 *
 * @param amount - Base amount in raw units
 * @param slippagePercent - Slippage as percentage (e.g., 0.5 for 0.5%)
 * @returns Amount with slippage applied
 */
function applySlippageToMax(
  amount: Decimal,
  slippagePercent: Decimal,
): Decimal {
  const slippageFactor = slippagePercent.div(100);
  return amount.mul(new Decimal(1).add(slippageFactor));
}

/**
 * Transform user input into addLiquidity payload
 *
 * CRITICAL UNDERSTANDING:
 * The on-chain program uses `amount_lp` to calculate exact amounts needed:
 *   amountX = (amount_lp * reserveX) / totalLpSupply
 *   amountY = (amount_lp * reserveY) / totalLpSupply
 *
 * Then it checks: amountX <= maxAmountX && amountY <= maxAmountY
 *
 * Strategy:
 * - Calculate LP tokens for user's input amounts
 * - Add slippage buffer to max amounts (in case pool ratio changed slightly)
 *
 * This function:
 * 1. Validates and parses user inputs
 * 2. Sorts token addresses to determine X and Y (lexicographic order)
 * 3. Converts human-readable amounts to raw units
 * 4. Calculates LP tokens based on input amounts
 * 5. Sets max amounts with slippage buffer
 *
 * @param input - User input with amounts and slippage
 * @returns Payload for add_liquidity instruction
 * @throws {Error} if validation fails or amounts are invalid
 */
export function transformAddLiquidityInput(
  input: AddLiquidityInput,
): AddLiquidityPayload {
  // Step 1: Validate input
  const validated = addLiquidityInputSchema.parse(input);

  // Step 2: Sort addresses to determine X and Y (lexicographic order)
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    validated.tokenAAddress,
    validated.tokenBAddress,
  );

  // Step 3: Parse amounts with precision
  const tokenAAmountDecimal = parseAmountSafe(validated.tokenAAmount);
  const tokenBAmountDecimal = parseAmountSafe(validated.tokenBAmount);
  const slippagePercent = parseAmountSafe(validated.slippage);

  // Step 4: Map tokenA/tokenB to tokenX/tokenY based on sorted order
  let amountXDecimal: Decimal;
  let amountYDecimal: Decimal;
  let decimalsX: number;
  let decimalsY: number;

  if (validated.tokenAAddress === tokenXAddress) {
    // TokenA is X, TokenB is Y
    amountXDecimal = tokenAAmountDecimal;
    amountYDecimal = tokenBAmountDecimal;
    decimalsX = validated.tokenADecimals;
    decimalsY = validated.tokenBDecimals;
  } else {
    // TokenB is X, TokenA is Y
    amountXDecimal = tokenBAmountDecimal;
    amountYDecimal = tokenAAmountDecimal;
    decimalsX = validated.tokenBDecimals;
    decimalsY = validated.tokenADecimals;
  }

  // Step 5: Convert base amounts to raw units
  const amountXRaw = toRawUnits(amountXDecimal, decimalsX);
  const amountYRaw = toRawUnits(amountYDecimal, decimalsY);

  // Step 6: Calculate LP tokens based on MINIMUM ratio to match on-chain behavior
  // The on-chain program will also use the minimum ratio, so we must match it exactly
  const reserveXDecimal = new Decimal(
    validated.poolReserves.reserveX.toString(),
  );
  const reserveYDecimal = new Decimal(
    validated.poolReserves.reserveY.toString(),
  );
  const totalLpSupplyDecimal = new Decimal(
    validated.poolReserves.totalLpSupply.toString(),
  );

  const amountXDecimalForCalc = new Decimal(amountXRaw.toString());
  const amountYDecimalForCalc = new Decimal(amountYRaw.toString());

  // Calculate LP from each side (same as on-chain)
  const lpFromX = amountXDecimalForCalc
    .mul(totalLpSupplyDecimal)
    .div(reserveXDecimal);
  const lpFromY = amountYDecimalForCalc
    .mul(totalLpSupplyDecimal)
    .div(reserveYDecimal);

  // Use minimum to match on-chain behavior
  const lpTokensDecimal = Decimal.min(lpFromX, lpFromY);

  // CRITICAL: Round DOWN the LP amount to be conservative
  // This ensures we request slightly LESS LP, so the required token amounts are also less
  // Giving us more breathing room with the maxAmount limits
  const lpTokensRaw = BigInt(lpTokensDecimal.toFixed(0, Decimal.ROUND_DOWN));

  // Step 7: Calculate amounts the program will need for this LP amount
  // CRITICAL: On-chain uses RoundDirection::Ceiling (rounds UP!)
  // From add_liquidity.rs:159-166 with lp_tokens_to_trading_tokens()
  // Formula: amountX = ceiling((lpTokens * reserveX) / totalLpSupply)
  // Note: These calculations are in RAW UNITS (already scaled by 10^decimals)
  const exactAmountXNeededRaw = lpTokensDecimal
    .mul(reserveXDecimal)
    .div(totalLpSupplyDecimal);
  const exactAmountYNeededRaw = lpTokensDecimal
    .mul(reserveYDecimal)
    .div(totalLpSupplyDecimal);

  // Round UP to match Rust's RoundDirection::Ceiling (values are in raw units)
  const ceilingAmountXRaw = new Decimal(
    exactAmountXNeededRaw.toFixed(0, Decimal.ROUND_UP),
  );
  const ceilingAmountYRaw = new Decimal(
    exactAmountYNeededRaw.toFixed(0, Decimal.ROUND_UP),
  );

  // Step 8: Calculate maxAmount based on USER INPUT, not ceiling amounts
  // CRITICAL INSIGHT: The user's input amounts already represent what they're willing to SEND
  // (including any transfer fees they expect). The on-chain program will:
  // 1. Calculate exact pool needs from amountLp
  // 2. Add inverse transfer fees to get user-send amount
  // 3. Compare user-send amount against our maxAmount
  //
  // Therefore, our maxAmount should be based on the USER'S INPUT (what they're sending),
  // not the calculated pool-received amount. Apply slippage to user input for safety.
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

  // Convert to bigint
  const maxAmountXRaw = BigInt(
    maxAmountXRawWithSlippage.toFixed(0, Decimal.ROUND_UP),
  );
  const maxAmountYRaw = BigInt(
    maxAmountYRawWithSlippage.toFixed(0, Decimal.ROUND_UP),
  );

  // Step 8: Build and validate final payload
  const payload: AddLiquidityPayload = {
    $typeName: "darklake.v1.AddLiquidityRequest",
    amountLp: lpTokensRaw,
    label: "",
    maxAmountX: maxAmountXRaw, // Desired LP tokens (calculated from user input)
    maxAmountY: maxAmountYRaw, // Max token X to deposit (with slippage buffer)
    refCode: "", // Max token Y to deposit (with slippage buffer)
    tokenMintX: tokenXAddress,
    tokenMintY: tokenYAddress,
    userAddress: validated.userAddress,
  };

  // Debug logging
  console.log("🔍 Add Liquidity Transformer Debug:", {
    calculations: {
      ceilingAmountXRaw: `${ceilingAmountXRaw.toString()} (ROUND_UP - matches Rust)`,
      ceilingAmountYRaw: `${ceilingAmountYRaw.toString()} (ROUND_UP - matches Rust)`,
      exactAmountXNeededRaw: `${exactAmountXNeededRaw.toFixed(0)} (before ceiling)`,
      exactAmountYNeededRaw: `${exactAmountYNeededRaw.toFixed(0)} (before ceiling)`,
      lpFromX: lpFromX.toString(),
      lpFromY: lpFromY.toString(),
      lpTokensRaw: `${lpTokensRaw.toString()} (min of lpFromX and lpFromY)`,
      note: "All amounts in RAW UNITS. LP tokens use MIN ratio, amounts rounded UP to match RoundDirection::Ceiling",
      userAmountXRaw: amountXRaw.toString(),
      userAmountYRaw: amountYRaw.toString(),
    },
    inputs: {
      slippage: `${validated.slippage}%`,
      tokenAAmount: validated.tokenAAmount,
      tokenADecimals: validated.tokenADecimals,
      tokenBAmount: validated.tokenBAmount,
      tokenBDecimals: validated.tokenBDecimals,
    },
    note: "⚠️ CRITICAL: poolReserves MUST be AVAILABLE reserves (matches add_liquidity.rs:149-157)!",
    output: {
      amountLp: lpTokensRaw.toString(),
      maxAmountXRaw: maxAmountXRaw.toString(),
      maxAmountYRaw: maxAmountYRaw.toString(),
      note: "maxAmounts = userInput * (1 + slippage)",
      slippage: `${slippagePercent.toString()}%`,
    },
    poolReserves: {
      reserveX: validated.poolReserves.reserveX.toString(),
      reserveY: validated.poolReserves.reserveY.toString(),
      totalLpSupply: validated.poolReserves.totalLpSupply.toString(),
    },
    verification: {
      formula: "maxAmount = userInputRaw * (1 + slippage)",
      note: "maxAmounts based on user input with slippage applied",
    },
  });

  // Final validation
  return addLiquidityPayloadSchema.parse(payload);
}
