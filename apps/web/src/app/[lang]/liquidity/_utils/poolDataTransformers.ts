import type { PoolDetails } from "../_types/liquidity.types";

/**
 * Type representing the raw pool data from the API
 */
export interface RawPoolData {
  readonly exists: boolean;
  readonly lpMint: string;
  readonly reserveX: number;
  readonly reserveXRaw?: number;
  readonly reserveY: number;
  readonly reserveYRaw?: number;
  readonly totalLpSupply: number;
  readonly totalLpSupplyRaw?: number;
  readonly tokenXMint: string;
  readonly tokenYMint: string;
  readonly lastUpdate: number;
  readonly totalReserveXRaw?: number;
  readonly totalReserveYRaw?: number;
  readonly protocolFeeX?: number;
  readonly protocolFeeY?: number;
  readonly userLockedX?: number;
  readonly userLockedY?: number;
}

/**
 * Pure function to transform raw pool data from the API into the PoolDetails format
 * used by the liquidity form.
 *
 * @param rawPoolData - Raw pool data from useRealtimePoolData or null
 * @returns Transformed PoolDetails object or null if no data
 */
export function transformPoolData(
  rawPoolData: RawPoolData | null | undefined,
): PoolDetails | null {
  if (!rawPoolData) {
    return null;
  }

  return {
    fee: undefined,
    poolAddress: rawPoolData.lpMint,
    price: undefined,
    protocolFeeX: rawPoolData.protocolFeeX,
    protocolFeeY: rawPoolData.protocolFeeY,
    tokenXMint: rawPoolData.tokenXMint,
    tokenXReserve: rawPoolData.reserveX,
    tokenXReserveRaw: rawPoolData.reserveXRaw,
    tokenYMint: rawPoolData.tokenYMint,
    tokenYReserve: rawPoolData.reserveY,
    tokenYReserveRaw: rawPoolData.reserveYRaw,
    totalReserveXRaw: rawPoolData.totalReserveXRaw,
    totalReserveYRaw: rawPoolData.totalReserveYRaw,
    totalSupply: rawPoolData.totalLpSupply,
    totalSupplyRaw: rawPoolData.totalLpSupplyRaw,
    userLockedX: rawPoolData.userLockedX,
    userLockedY: rawPoolData.userLockedY,
  };
}

/**
 * Pure function to sort token addresses for consistent pool key generation.
 * This ensures that Token A and Token B always map to Token X and Token Y
 * in a predictable way.
 *
 * @param tokenAAddress - First token address
 * @param tokenBAddress - Second token address
 * @returns Object with sorted tokenXAddress and tokenYAddress
 */
export function getSortedTokenAddresses(
  tokenAAddress: string,
  tokenBAddress: string,
): { tokenXAddress: string; tokenYAddress: string } {
  // Lexicographic comparison for deterministic ordering
  const [tokenX, tokenY] =
    tokenAAddress.localeCompare(tokenBAddress) < 0
      ? [tokenAAddress, tokenBAddress]
      : [tokenBAddress, tokenAAddress];

  return {
    tokenXAddress: tokenX,
    tokenYAddress: tokenY,
  };
}
