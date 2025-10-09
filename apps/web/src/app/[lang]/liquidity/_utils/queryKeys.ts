/**
 * Standardized Query Key Factory
 *
 * Centralizes React Query key creation for token-pair-related queries.
 * This ensures consistency, prevents stale data issues, and makes cache
 * invalidation more reliable.
 *
 * Benefits:
 * - Same pool always uses same key (prevents duplicate caches)
 * - Invalidation targets correct queries
 * - Type-safe query key construction
 * - Easy to refactor (single place to update)
 *
 * @module queryKeys
 */

import type { TokenOrderContext } from "@dex-web/utils";

/**
 * Creates a standardized query key for pool data.
 *
 * Uses protocol order (sorted addresses) to ensure the same pool always
 * gets the same key, regardless of how the user selected the tokens.
 *
 * @param orderContext - Token order context from useTokenOrder
 * @returns Tuple for React Query queryKey
 *
 * @example
 * ```typescript
 * const orderContext = useTokenOrder();
 * const { data } = useQuery({
 *   queryKey: createPoolQueryKey(orderContext),
 *   queryFn: () => fetchPool(orderContext),
 *   enabled: !!orderContext,
 * });
 * ```
 *
 * @example Invalidation
 * ```typescript
 * // Invalidate pool data
 * queryClient.invalidateQueries({
 *   queryKey: createPoolQueryKey(orderContext),
 * });
 * ```
 */
export function createPoolQueryKey(
  orderContext: TokenOrderContext | null,
):
  | readonly [string, string, string]
  | readonly [string, string, string, string] {
  if (!orderContext) {
    return ["pool", "", ""] as const;
  }

  const poolKey = `${orderContext.protocol.tokenX}-${orderContext.protocol.tokenY}`;

  return [
    "pool",
    poolKey,
    orderContext.protocol.tokenX,
    orderContext.protocol.tokenY,
  ] as const;
}

/**
 * Creates a standardized query key for LP token estimation.
 *
 * Includes amounts in the key since estimation varies with these.
 * Note: Slippage is not included as the quote API uses 0 slippage for estimation
 * to avoid backend math overflow errors. Actual slippage is applied during transaction execution.
 *
 * @param orderContext - Token order context
 * @param amountX - Amount of token X (in protocol order)
 * @param amountY - Amount of token Y (in protocol order)
 * @returns Tuple for React Query queryKey
 *
 * @example
 * ```typescript
 * const orderContext = useTokenOrder();
 * const protocolAmounts = mapAmountsToProtocol(uiAmounts, orderContext);
 *
 * const { data } = useQuery({
 *   queryKey: createLPEstimationQueryKey(
 *     orderContext,
 *     protocolAmounts.amountX,
 *     protocolAmounts.amountY
 *   ),
 *   queryFn: () => estimateLP(...),
 * });
 * ```
 */
export function createLPEstimationQueryKey(
  orderContext: TokenOrderContext | null,
  amountX: string | number,
  amountY: string | number,
): readonly [string, string, string, string | number, string | number] {
  if (!orderContext) {
    return ["lp-estimation", "", "", 0, 0] as const;
  }

  return [
    "lp-estimation",
    orderContext.protocol.tokenX,
    orderContext.protocol.tokenY,
    amountX,
    amountY,
  ] as const;
}

/**
 * Creates a standardized query key for token account data.
 *
 * Uses protocol order for consistency, includes wallet address.
 *
 * @param orderContext - Token order context
 * @param walletAddress - User's wallet address
 * @returns Tuple for React Query queryKey
 *
 * @example
 * ```typescript
 * const orderContext = useTokenOrder();
 *
 * const { data: tokenXAccount } = useQuery({
 *   queryKey: createTokenAccountQueryKey(orderContext, publicKey?.toBase58()),
 *   queryFn: () => fetchTokenAccount(...),
 * });
 * ```
 */
export function createTokenAccountQueryKey(
  orderContext: TokenOrderContext | null,
  walletAddress: string | null | undefined,
  tokenType: "tokenX" | "tokenY",
): readonly [string, string | undefined, string] {
  if (!orderContext || !walletAddress) {
    return ["token-accounts", undefined, ""] as const;
  }

  const tokenAddress =
    tokenType === "tokenX"
      ? orderContext.protocol.tokenX
      : orderContext.protocol.tokenY;

  return ["token-accounts", walletAddress, tokenAddress] as const;
}

/**
 * Helper to invalidate all queries related to a specific token pair.
 *
 * Useful when a transaction completes and you want to refresh all
 * related data (pool reserves, LP estimates, token balances).
 *
 * @param queryClient - React Query client
 * @param orderContext - Token order context
 *
 * @example
 * ```typescript
 * // After successful liquidity transaction
 * await invalidateTokenPairQueries(queryClient, orderContext);
 * ```
 */
export async function invalidateTokenPairQueries(
  queryClient: {
    invalidateQueries: (options: {
      queryKey: readonly string[];
    }) => Promise<void>;
  },
  orderContext: TokenOrderContext | null,
): Promise<void> {
  if (!orderContext) return;

  await queryClient.invalidateQueries({
    queryKey: ["pool"] as const,
  });

  await queryClient.invalidateQueries({
    queryKey: ["lp-estimation", orderContext.protocol.tokenX] as const,
  });

  await queryClient.invalidateQueries({
    queryKey: ["token-accounts"] as const,
  });
}

/**
 * Type-safe query key patterns for matching queries.
 *
 * Use these with queryClient.invalidateQueries() to target specific query types.
 *
 * @example
 * ```typescript
 * // Invalidate all pool queries
 * queryClient.invalidateQueries({
 *   queryKey: QueryKeyPatterns.allPools,
 * });
 *
 * // Invalidate LP estimations for specific token
 * queryClient.invalidateQueries({
 *   queryKey: QueryKeyPatterns.lpEstimationForToken(tokenX),
 * });
 * ```
 */
export const QueryKeyPatterns = {
  /** Matches all LP estimation queries */
  allLPEstimations: ["lp-estimation"] as const,
  /** Matches all pool queries */
  allPools: ["pool"] as const,

  /** Matches all token account queries */
  allTokenAccounts: ["token-accounts"] as const,

  /** Matches LP estimations for a specific token */
  lpEstimationForToken: (tokenAddress: string) =>
    ["lp-estimation", tokenAddress] as const,

  /** Matches token accounts for a specific wallet */
  tokenAccountsForWallet: (walletAddress: string) =>
    ["token-accounts", walletAddress] as const,
} as const;
