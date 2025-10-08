/**
 * Calculates the LP token amount for a given liquidity deposit
 * @param amountX - Amount of token X to deposit
 * @param amountY - Amount of token Y to deposit
 * @param reserves - Current pool reserves
 * @returns LP token amount to mint as bigint
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
  // For a new pool with no liquidity, return a default amount
  if (
    reserves.totalLpSupply === 0 ||
    reserves.reserveX === 0 ||
    reserves.reserveY === 0
  ) {
    return BigInt(1);
  }

  // Calculate LP tokens based on the proportion of liquidity added
  // Use the minimum to ensure both amounts are satisfied
  const lpFromX = (amountX / reserves.reserveX) * reserves.totalLpSupply;
  const lpFromY = (amountY / reserves.reserveY) * reserves.totalLpSupply;

  return BigInt(Math.floor(Math.min(lpFromX, lpFromY)));
}

/**
 * Converts a decimal amount to lamports (smallest unit with 9 decimals)
 * @param amount - Decimal amount to convert
 * @returns Amount in lamports as bigint
 */
export function convertToLamports(amount: number): bigint {
  const LAMPORTS_PER_SOL = 1_000_000_000;
  return BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
}
