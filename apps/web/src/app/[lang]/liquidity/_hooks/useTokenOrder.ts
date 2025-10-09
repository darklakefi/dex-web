/**
 * Token Order Hook
 *
 * This hook provides a convenient way to access token order context derived
 * from URL search parameters (managed by nuqs). It follows the principle of
 * deriving state rather than duplicating it.
 *
 * Architecture:
 * - nuqs manages URL state (single source of truth)
 * - This hook computes token order on demand
 * - Pure functions ensure consistent behavior
 * - No separate context state to keep in sync
 *
 * @module useTokenOrder
 */

"use client";

import {
  createTokenOrderContext,
  type TokenOrderContext,
} from "@dex-web/utils";
import { useQueryStates } from "nuqs";
import { useMemo } from "react";
import { selectedTokensParsers } from "../../../_utils/searchParams";

/**
 * Hook to get token order context derived from URL search parameters.
 *
 * This hook reads tokenAAddress and tokenBAddress from URL params (via nuqs)
 * and derives the complete token order context. The context is memoized and
 * only recalculates when the token addresses change.
 *
 * Benefits of this approach:
 * - Single source of truth (URL params via nuqs)
 * - No duplicate state to keep in sync
 * - Automatically updates when URL changes
 * - Works with browser back/forward
 * - Shareable URLs maintain token order
 *
 * @returns Token order context or null if tokens aren't set
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const orderContext = useTokenOrder();
 *
 *   if (!orderContext) {
 *     return <div>Select tokens to continue</div>;
 *   }
 *
 *   // Use protocol order for queries
 *   const poolData = usePoolData({
 *     tokenXMint: orderContext.protocol.tokenX,
 *     tokenYMint: orderContext.protocol.tokenY,
 *   });
 *
 *   // Use UI order for display
 *   return <div>You selected: {orderContext.ui.tokenA}</div>;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Map amounts to protocol order
 * function TransactionComponent() {
 *   const orderContext = useTokenOrder();
 *   const [formData] = useForm();
 *
 *   const handleSubmit = () => {
 *     if (!orderContext) return;
 *
 *     const protocolAmounts = mapAmountsToProtocol({
 *       tokenA: orderContext.ui.tokenA,
 *       tokenB: orderContext.ui.tokenB,
 *       amountA: formData.amountA,
 *       amountB: formData.amountB,
 *     }, orderContext);
 *
 *     submitTransaction(protocolAmounts);
 *   };
 * }
 * ```
 */
export function useTokenOrder(): TokenOrderContext | null {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const context = useMemo(() => {
    if (!tokenAAddress || !tokenBAddress) {
      return null;
    }

    return createTokenOrderContext(tokenAAddress, tokenBAddress);
  }, [tokenAAddress, tokenBAddress]);

  return context;
}

/**
 * Hook to get token order context with error handling.
 *
 * Unlike useTokenOrder, this hook throws an error if tokens aren't set.
 * Use this in components that require tokens to be present.
 *
 * @returns Token order context (never null)
 * @throws {Error} If tokens aren't set in URL params
 *
 * @example
 * ```typescript
 * function RequiresTokens() {
 *   // This will throw if tokens aren't in URL
 *   const orderContext = useTokenOrderRequired();
 *
 *   // Safe to use without null checks
 *   return <div>{orderContext.ui.tokenA}</div>;
 * }
 * ```
 */
export function useTokenOrderRequired(): TokenOrderContext {
  const context = useTokenOrder();

  if (!context) {
    throw new Error(
      "useTokenOrderRequired: tokens must be set in URL parameters. " +
        "Ensure tokenAAddress and tokenBAddress are present in search params.",
    );
  }

  return context;
}
