import { calculateLpTokensToMint } from "@dex-web/utils";

/**
 * Calculates the LP token amount for a given liquidity deposit
 * Uses the shared liquidityMath utility matching @darklakefi/ts-sdk-on-chain
 *
 * @param amountX - Amount of token X to deposit (in human-readable units)
 * @param amountY - Amount of token Y to deposit (in human-readable units)
 * @param reserves - Current pool reserves (in human-readable units)
 * @returns LP token amount to mint (in human-readable units, NOT raw units)
 */
export function calculateLpTokenAmount(
  amountX: number,
  amountY: number,
  reserves: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  },
): bigint {
  const lpTokensDecimal = calculateLpTokensToMint(amountX, amountY, reserves);

  // Convert to bigint, rounding down
  return BigInt(lpTokensDecimal.toFixed(0));
}
