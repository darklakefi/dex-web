import type { GetUserLiquidityOutput } from "@dex-web/orpc/schemas";
import { parseAmount } from "@dex-web/utils";

export interface LiquidityCalculationParams {
  tokenAAmount: string;
  tokenBAmount: string;
  poolReserves: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  } | null;
}

export interface OptimisticUpdateData {
  userLiquidity: {
    hasLiquidity: boolean;
    lpTokenBalance: number;
  };
  poolReserves: {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  };
}

export function calculateLpTokensFromDeposit({
  tokenAAmount,
  tokenBAmount,
  poolReserves,
}: LiquidityCalculationParams): number {
  if (!poolReserves || poolReserves.totalLpSupply === 0) {
    return 1;
  }

  const parsedAmountA = parseAmount(tokenAAmount);
  const parsedAmountB = parseAmount(tokenBAmount);

  const lpTokensFromTokenA =
    (parsedAmountA / poolReserves.reserveX) * poolReserves.totalLpSupply;
  const lpTokensFromTokenB =
    (parsedAmountB / poolReserves.reserveY) * poolReserves.totalLpSupply;

  return Math.min(lpTokensFromTokenA, lpTokensFromTokenB);
}

export function createOptimisticLiquidityUpdate(
  previousLiquidity: GetUserLiquidityOutput | undefined,
  lpTokensToAdd: number,
): GetUserLiquidityOutput | undefined {
  if (!previousLiquidity) return undefined;

  return {
    ...previousLiquidity,
    hasLiquidity: true,
    lpTokenBalance: previousLiquidity.lpTokenBalance + lpTokensToAdd,
  };
}

export function createOptimisticPoolReservesUpdate(
  previousReserves: unknown,
  tokenAAmount: number,
  tokenBAmount: number,
  lpTokensToAdd: number,
) {
  if (!previousReserves) return undefined;

  const reserves = previousReserves as {
    reserveX: number;
    reserveY: number;
    totalLpSupply: number;
  };

  return {
    ...previousReserves,
    reserveX: reserves.reserveX + tokenAAmount,
    reserveY: reserves.reserveY + tokenBAmount,
    totalLpSupply: reserves.totalLpSupply + lpTokensToAdd,
  };
}
