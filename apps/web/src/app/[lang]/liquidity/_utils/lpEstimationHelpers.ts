/**
 * Pure helper functions for LP token estimation
 *
 * These functions are extracted from useLPTokenEstimation for better testability
 * and separation of concerns. All functions are pure with no side effects.
 *
 * @module lpEstimationHelpers
 */

import type { TokenOrderContext } from "@dex-web/utils";
import { toRawUnitsBigNumberAsBigInt } from "@dex-web/utils";

/**
 * Maps UI token amounts (A/B) to protocol token amounts (X/Y) based on order context
 *
 * @param orderContext - Token order mapping context
 * @param tokenAAmount - Token A amount string
 * @param tokenBAmount - Token B amount string
 * @param tokenADecimals - Token A decimals
 * @param tokenBDecimals - Token B decimals
 * @returns Protocol-ordered amounts and decimals, or zeros if no context
 *
 * @example
 * ```typescript
 * const result = mapUIToProtocolOrder(
 *   { mapping: { tokenAIsX: true }, ... },
 *   "100",
 *   "200",
 *   9,
 *   6
 * );
 * // Returns: { tokenXAmount: "100", tokenYAmount: "200", tokenXDecimals: 9, tokenYDecimals: 6 }
 * ```
 */
export function mapUIToProtocolOrder(
  orderContext: TokenOrderContext | null,
  tokenAAmount: string,
  tokenBAmount: string,
  tokenADecimals: number,
  tokenBDecimals: number,
): {
  tokenXAmount: string;
  tokenYAmount: string;
  tokenXDecimals: number;
  tokenYDecimals: number;
} {
  if (!orderContext) {
    return {
      tokenXAmount: "0",
      tokenXDecimals: 0,
      tokenYAmount: "0",
      tokenYDecimals: 0,
    };
  }

  const isTokenAIsX = orderContext.mapping.tokenAIsX;

  return {
    tokenXAmount: isTokenAIsX ? tokenAAmount : tokenBAmount,
    tokenXDecimals: isTokenAIsX ? tokenADecimals : tokenBDecimals,
    tokenYAmount: isTokenAIsX ? tokenBAmount : tokenAAmount,
    tokenYDecimals: isTokenAIsX ? tokenBDecimals : tokenADecimals,
  };
}

/**
 * Converts token amounts from display units to atomic units (bigint)
 *
 * @param tokenXAmount - Token X amount as string
 * @param tokenYAmount - Token Y amount as string
 * @param tokenXDecimals - Token X decimals
 * @param tokenYDecimals - Token Y decimals
 * @returns Object with atomic amounts and slippage, returns zeros on error
 *
 * @example
 * ```typescript
 * const result = convertToAtomicAmounts("100", "200", 9, 6);
 * // Returns: { tokenXAtomicAmount: 100000000000n, tokenYAtomicAmount: 200000000n, slippageAtomic: 0n }
 * ```
 */
export function convertToAtomicAmounts(
  tokenXAmount: string,
  tokenYAmount: string,
  tokenXDecimals: number,
  tokenYDecimals: number,
): {
  tokenXAtomicAmount: bigint;
  tokenYAtomicAmount: bigint;
  slippageAtomic: bigint;
} {
  try {
    const tokenXAtomicAmount = toRawUnitsBigNumberAsBigInt(
      Number.parseFloat(tokenXAmount) || 0,
      tokenXDecimals,
    );
    const tokenYAtomicAmount = toRawUnitsBigNumberAsBigInt(
      Number.parseFloat(tokenYAmount) || 0,
      tokenYDecimals,
    );

    return {
      slippageAtomic: 0n,
      tokenXAtomicAmount,
      tokenYAtomicAmount,
    };
  } catch {
    return {
      slippageAtomic: 0n,
      tokenXAtomicAmount: 0n,
      tokenYAtomicAmount: 0n,
    };
  }
}

/**
 * Determines if the LP estimation query should be enabled
 *
 * Query is enabled only when:
 * - enabled flag is true
 * - orderContext exists
 * - both amounts are valid numbers > 0
 * - both atomic amounts are > 0 (prevents precision loss issues)
 *
 * @param enabled - External enable flag
 * @param orderContext - Token order context
 * @param tokenXAmount - Token X amount string
 * @param tokenYAmount - Token Y amount string
 * @param tokenXAtomicAmount - Token X atomic amount
 * @param tokenYAtomicAmount - Token Y atomic amount
 * @returns true if query should be enabled
 *
 * @example
 * ```typescript
 * shouldEnableQuery(true, orderContext, "100", "200", 100000000000n, 200000000n);
 * // Returns: true
 *
 * shouldEnableQuery(true, orderContext, "0", "200", 0n, 200000000n);
 * // Returns: false (tokenX is zero)
 * ```
 */
export function shouldEnableQuery(
  enabled: boolean,
  orderContext: TokenOrderContext | null,
  tokenXAmount: string,
  tokenYAmount: string,
  tokenXAtomicAmount: bigint,
  tokenYAtomicAmount: bigint,
): boolean {
  if (!enabled || !orderContext) return false;

  const tokenXNum = Number.parseFloat(tokenXAmount);
  const tokenYNum = Number.parseFloat(tokenYAmount);

  const hasValidAmounts =
    !Number.isNaN(tokenXNum) &&
    !Number.isNaN(tokenYNum) &&
    tokenXNum > 0 &&
    tokenYNum > 0 &&
    tokenXAtomicAmount > 0n &&
    tokenYAtomicAmount > 0n;

  return hasValidAmounts;
}

/**
 * Converts LP token response from atomic units to display format
 *
 * Uses bigint arithmetic to avoid precision loss from Number conversion.
 * This prevents glitches with large amounts or high-decimal tokens.
 *
 * @param lpTokenAmount - LP token amount in atomic units (bigint)
 * @param lpTokenDecimals - LP token decimals (bigint or number)
 * @returns Object with display string, raw bigint, and decimals
 *
 * @example
 * ```typescript
 * const result = convertLPTokenResponse(1000000000n, 9);
 * // Returns: { estimatedLPTokens: "1", lpTokenAmountRaw: 1000000000n, lpTokenDecimals: 9 }
 * ```
 */
export function convertLPTokenResponse(
  lpTokenAmount: bigint,
  lpTokenDecimals: bigint | number,
): {
  estimatedLPTokens: string;
  lpTokenAmountRaw: bigint;
  lpTokenDecimals: number;
} {
  const decimals = Number(lpTokenDecimals);

  if (!Number.isFinite(decimals) || Number.isNaN(decimals)) {
    return {
      estimatedLPTokens: "0",
      lpTokenAmountRaw: 0n,
      lpTokenDecimals: 0,
    };
  }

  if (lpTokenAmount === 0n) {
    return {
      estimatedLPTokens: "0",
      lpTokenAmountRaw: lpTokenAmount,
      lpTokenDecimals: decimals,
    };
  }

  const divisor = BigInt(10 ** decimals);
  const wholePart = lpTokenAmount / divisor;
  const fractionalPart = lpTokenAmount % divisor;

  if (fractionalPart === 0n) {
    return {
      estimatedLPTokens: wholePart.toString(),
      lpTokenAmountRaw: lpTokenAmount,
      lpTokenDecimals: decimals,
    };
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const estimatedLPTokens = `${wholePart}.${fractionalStr}`.replace(
    /\.?0+$/,
    "",
  );

  return {
    estimatedLPTokens,
    lpTokenAmountRaw: lpTokenAmount,
    lpTokenDecimals: decimals,
  };
}
