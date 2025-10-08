import type { GetUserLiquidityOutput } from "@dex-web/orpc/schemas";
import {
  parseAmount,
  parseAmountBigNumber,
  sortSolanaAddresses,
} from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";

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

/**
 * @deprecated Use calculateLpTokenAmount from calculateLpTokens.ts instead
 * This function uses basic JS math which can have precision issues.
 * The new implementation uses Decimal.js matching @darklakefi/ts-sdk-on-chain
 */
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

export interface PoolDetails {
  tokenXMint: string;
  tokenYMint: string;
}

export interface TokenAmounts {
  tokenAAmount: string;
  tokenBAmount: string;
}

export interface TokenAddresses {
  tokenAAddress: string;
  tokenBAddress: string;
}

export interface LiquidityAmountsResult {
  maxAmountX: number;
  maxAmountY: number;
}

export function calculateLiquidityAmounts(
  poolDetails: PoolDetails,
  tokenAmounts: TokenAmounts,
  tokenAddresses: TokenAddresses,
): LiquidityAmountsResult {
  const { tokenAAmount, tokenBAmount } = tokenAmounts;
  const { tokenAAddress, tokenBAddress } = tokenAddresses;
  const { tokenXMint } = poolDetails;

  const parsedAmountA = parseAmount(tokenAAmount);
  const parsedAmountB = parseAmount(tokenBAmount);

  // Determine which token corresponds to X and Y based on addresses
  if (tokenBAddress === tokenXMint) {
    // Token B is X, Token A is Y (sell scenario)
    return {
      maxAmountX: parsedAmountB,
      maxAmountY: parsedAmountA,
    };
  } else if (tokenAAddress === tokenXMint) {
    // Token A is X, Token B is Y (buy scenario)
    return {
      maxAmountX: parsedAmountA,
      maxAmountY: parsedAmountB,
    };
  } else {
    // Neither token matches X, default to Y
    return {
      maxAmountX: parsedAmountB,
      maxAmountY: parsedAmountA,
    };
  }
}

export function calculateTokenAmountByPrice(
  amount: string,
  price: string,
): string {
  const parsedAmount = parseAmountBigNumber(amount);

  if (parsedAmount.gt(0) && parseFloat(price) > 0) {
    return parsedAmount.multipliedBy(price).toString();
  }

  return "0";
}

export interface LiquidityTransactionPayloadParams {
  poolDetails: PoolDetails;
  tokenAmounts: TokenAmounts;
  tokenAddresses: TokenAddresses;
  slippage: string;
  publicKey: PublicKey;
}

export interface LiquidityTransactionPayload {
  maxAmountX: number;
  maxAmountY: number;
  slippage: number;
  tokenXMint: string;
  tokenYMint: string;
  user: string;
}

export function createLiquidityTransactionPayload(
  params: LiquidityTransactionPayloadParams,
): LiquidityTransactionPayload {
  const { poolDetails, tokenAmounts, tokenAddresses, slippage, publicKey } =
    params;

  const sortedAddresses = sortSolanaAddresses(
    tokenAddresses.tokenAAddress,
    tokenAddresses.tokenBAddress,
  );

  if (!sortedAddresses.tokenXAddress || !sortedAddresses.tokenYAddress) {
    throw new Error("Invalid token addresses after sorting");
  }

  const amounts = calculateLiquidityAmounts(
    poolDetails,
    tokenAmounts,
    tokenAddresses,
  );

  return {
    maxAmountX: amounts.maxAmountX,
    maxAmountY: amounts.maxAmountY,
    slippage: parseFloat(slippage),
    tokenXMint: sortedAddresses.tokenXAddress,
    tokenYMint: sortedAddresses.tokenYAddress,
    user: publicKey.toBase58(),
  };
}

export function determineInputType(
  action: "buy" | "sell",
  poolDetails: PoolDetails | null,
  tokenAAddress: string | null | undefined,
  tokenBAddress: string | null | undefined,
): "tokenX" | "tokenY" {
  // If no pool details, default to tokenX
  if (!poolDetails) {
    return "tokenX";
  }

  // If token addresses are null/undefined/empty, default to tokenY
  if (
    !tokenAAddress ||
    !tokenBAddress ||
    tokenAAddress === "" ||
    tokenBAddress === ""
  ) {
    return "tokenY";
  }

  const { tokenXMint } = poolDetails;

  // For sell: if tokenB matches tokenXMint, return tokenX
  if (action === "sell" && tokenBAddress === tokenXMint) {
    return "tokenX";
  }

  // For buy: if tokenA matches tokenXMint, return tokenX
  if (action === "buy" && tokenAAddress === tokenXMint) {
    return "tokenX";
  }

  // Default to tokenY for other cases
  return "tokenY";
}
