import type { PoolData } from "../../../../hooks/usePoolData";
import type { PoolDetails } from "../_types/liquidity.types";

/**
 * Transforms raw pool data from the API to the PoolDetails format used by liquidity forms.
 * This is a pure function that can be easily tested.
 *
 * Following Implementation Answer #3: Feature-specific transformations should live in the feature,
 * not in shared hooks. This keeps module boundaries clean.
 *
 * @param data - Raw pool data from API (or null)
 * @param tokenXMint - Token X mint address for the query
 * @param tokenYMint - Token Y mint address for the query
 * @returns PoolDetails or null if pool doesn't exist
 */
export function transformToPoolDetails(
  data: PoolData | null,
  tokenXMint: string,
  tokenYMint: string,
): PoolDetails | null {
  if (!data || !data.exists) return null;

  return {
    fee: undefined,
    poolAddress: data.lpMint,
    price: undefined,
    protocolFeeX: data.protocolFeeX,
    protocolFeeY: data.protocolFeeY,
    tokenXMint,
    tokenXReserve: data.reserveX,
    tokenXReserveRaw: data.reserveXRaw,
    tokenYMint,
    tokenYReserve: data.reserveY,
    tokenYReserveRaw: data.reserveYRaw,
    totalReserveXRaw: data.totalReserveXRaw,
    totalReserveYRaw: data.totalReserveYRaw,
    totalSupply: data.totalLpSupply,
    totalSupplyRaw: data.totalLpSupplyRaw,
    userLockedX: data.userLockedX,
    userLockedY: data.userLockedY,
  };
}
