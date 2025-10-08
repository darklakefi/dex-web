import { Decimal } from "decimal.js";
import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";
import { parseAmount } from "../common/amountUtils";
import {
  applySlippage,
  calculateLpTokensToMint,
  toRawUnitsBigint,
} from "./liquidityMath";

export interface AddLiquidityTransformParams {
  tokenAAddress: string;
  tokenBAddress: string;
  tokenAAmount: string;
  tokenBAmount: string;
  slippage: string;
  poolTokenXMint: string;
  tokenXDecimals: number;
  tokenYDecimals: number;
  userAddress: string;
  // Pool reserves (available reserves excluding locked amounts and protocol fees)
  poolReserves: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  };
  lpTokenDecimals: number; // Usually 9 for Darklake
}

export interface AddLiquidityPayload {
  tokenMintX: string;
  tokenMintY: string;
  maxAmountX: bigint;
  maxAmountY: bigint;
  amountLp: bigint;
  userAddress: string;
  label: string;
  refCode: string;
}

/**
 * Transform liquidity parameters to the payload format for the dex-gateway
 *
 * This function:
 * 1. Sorts token addresses to determine X and Y
 * 2. Maps token A/B amounts to X/Y based on pool configuration
 * 3. Applies slippage to create max amounts (for price protection)
 * 4. Calculates LP tokens to mint based on the minimum LP from either token
 * 5. Converts all amounts to raw units (scaled by decimals)
 *
 * Key calculation flow (matching @darklakefi/ts-sdk-on-chain):
 * - lpFromX = (amountX / reserveX) * totalLpSupply
 * - lpFromY = (amountY / reserveY) * totalLpSupply
 * - amountLp = min(lpFromX, lpFromY)
 *
 * @param params - Liquidity transformation parameters
 * @returns Payload ready for dex-gateway addLiquidity call
 */
export function transformToAddLiquidityPayload(
  params: AddLiquidityTransformParams,
): AddLiquidityPayload {
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
    params.tokenAAddress,
    params.tokenBAddress,
  );

  const tokenAAmount = parseAmount(params.tokenAAmount);
  const tokenBAmount = parseAmount(params.tokenBAmount);

  // Determine which input token corresponds to X and Y
  // If tokenB is the pool's X, then we're in "sell" mode (tokenB=X, tokenA=Y)
  // Otherwise we're in "buy" mode (tokenA=X, tokenB=Y)
  const isTokenXSell = params.poolTokenXMint === params.tokenBAddress;
  const baseAmountX = isTokenXSell ? tokenBAmount : tokenAAmount;
  const baseAmountY = isTokenXSell ? tokenAAmount : tokenBAmount;

  const slippagePercent = parseFloat(params.slippage || "0.5");

  // Apply slippage to get max amounts (user willing to pay up to this much)
  const baseAmountXDecimal = new Decimal(baseAmountX);
  const baseAmountYDecimal = new Decimal(baseAmountY);

  const maxAmountXDecimal = applySlippage(
    baseAmountXDecimal,
    slippagePercent,
    true, // isMax = true, so add slippage
  );
  const maxAmountYDecimal = applySlippage(
    baseAmountYDecimal,
    slippagePercent,
    true,
  );

  // Convert to raw units using Decimal to avoid precision errors
  const maxAmountXRaw = toRawUnitsBigint(
    maxAmountXDecimal,
    params.tokenXDecimals,
  );
  const maxAmountYRaw = toRawUnitsBigint(
    maxAmountYDecimal,
    params.tokenYDecimals,
  );

  // Calculate LP tokens based on actual amounts (not max amounts)
  // This uses the min of (amountX/reserveX) and (amountY/reserveY) ratios
  // NOTE: The backend will recalculate this with FRESH pool state
  // Our calculation here is based on potentially stale reserves
  // We apply slippage tolerance to account for pool state changes
  const lpTokensDecimal = calculateLpTokensToMint(
    baseAmountX,
    baseAmountY,
    params.poolReserves,
  );

  // Apply slippage to get minimum acceptable LP tokens
  // This protects against pool state changes between our calculation and on-chain execution
  const minLpTokensDecimal = applySlippage(
    lpTokensDecimal,
    slippagePercent,
    false, // false = subtract slippage for minimum
  );

  // Convert LP tokens to raw units using Decimal to avoid precision errors
  const lpTokensRaw = toRawUnitsBigint(
    minLpTokensDecimal,
    params.lpTokenDecimals,
  );

  return {
    amountLp: lpTokensRaw,
    label: "",
    maxAmountX: maxAmountXRaw,
    maxAmountY: maxAmountYRaw,
    refCode: "",
    tokenMintX: tokenXAddress,
    tokenMintY: tokenYAddress,
    userAddress: params.userAddress,
  };
}
