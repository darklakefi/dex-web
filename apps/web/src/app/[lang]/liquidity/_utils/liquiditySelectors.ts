import BigNumber from "bignumber.js";
import type {
  PoolDetails,
  UseRealtimeTokenAccountsReturn,
} from "../_types/liquidity.types";

/**
 * Pure selector functions for deriving liquidity form state.
 * These functions have no side effects and always return the same output for the same input.
 */

export interface LiquidityViewState {
  readonly shouldShowAddLiquidityDetails: boolean;
  readonly isInitialLoading: boolean;
}

/**
 * Determines the view state for the liquidity form based on current data.
 * @param poolDetails - Current pool information
 * @param tokenAAmount - Token A input amount
 * @param tokenBAmount - Token B input amount
 * @param tokenAAddress - Token A address
 * @param tokenBAddress - Token B address
 * @param tokenAccountsData - Token accounts loading state
 * @param isPoolLoading - Whether pool data is loading
 * @returns Derived view state
 */
export function selectLiquidityViewState(
  poolDetails: PoolDetails | null,
  tokenAAmount: string,
  tokenBAmount: string,
  tokenAAddress: string | null,
  tokenBAddress: string | null,
  tokenAccountsData: UseRealtimeTokenAccountsReturn,
  isPoolLoading: boolean,
): LiquidityViewState {
  const shouldShowAddLiquidityDetails =
    Boolean(poolDetails) &&
    tokenAAmount !== "" &&
    tokenBAmount !== "" &&
    BigNumber(tokenAAmount).gt(0) &&
    BigNumber(tokenBAmount).gt(0);

  const isInitialLoading =
    !tokenAAddress ||
    !tokenBAddress ||
    (tokenAccountsData.isLoadingBuy && tokenAccountsData.isLoadingSell) ||
    isPoolLoading;

  return {
    isInitialLoading,
    shouldShowAddLiquidityDetails,
  };
}

/**
 * Creates a URL for the create pool page.
 * @param serialize - URL serialization function
 * @param createPoolType - The page type constant
 * @returns Serialized URL with parameters
 */
export function createPoolUrl(
  serialize: (path: string, params: Record<string, string>) => string,
  createPoolType: string,
): string {
  return `/${serialize("liquidity", { type: createPoolType })}`;
}
