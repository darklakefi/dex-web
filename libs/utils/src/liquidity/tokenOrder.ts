/**
 * Token Order Management
 *
 * This module provides the core functions for managing token ordering throughout
 * the application. It serves as the single source of truth for converting between
 * UI order (user's selection) and Protocol order (sorted addresses).
 *
 * Key principles:
 * - Pure functions only - no side effects
 * - Immutable data structures
 * - Single responsibility - each function does one thing well
 * - Type-safe transformations using branded types
 *
 * @module tokenOrder
 */

import { sortSolanaAddresses } from "../blockchain/sortSolanaAddresses";
import type {
  OrderMapping,
  ProtocolOrder,
  TokenAddress,
  TokenAmountsProtocol,
  TokenAmountsUI,
  TokenOrderContext,
  TokenPairProtocol,
  TokenPairUI,
  UIOrder,
} from "./tokenOrderTypes";

/**
 * Creates a complete token order context from UI order inputs.
 *
 * This is the SINGLE place where `sortSolanaAddresses` should be called in the
 * liquidity flow. All other code should use the resulting context.
 *
 * The function:
 * 1. Takes tokens in the user's selection order
 * 2. Sorts them to determine protocol order
 * 3. Creates mapping information to translate between orders
 * 4. Returns immutable context containing all three representations
 *
 * @param tokenA - First token address from URL params
 * @param tokenB - Second token address from URL params
 * @returns Complete context with UI order, Protocol order, and mapping
 * @throws {Error} If either token address is invalid
 *
 * @example
 * ```typescript
 * // User selected USDC first, SOL second
 * const context = createTokenOrderContext(
 *   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
 *   'So11111111111111111111111111111111111111112'   // SOL
 * );
 *
 * // Result:
 * // context.ui.tokenA = USDC (user's first choice)
 * // context.ui.tokenB = SOL (user's second choice)
 * // context.protocol.tokenX = USDC (sorts first)
 * // context.protocol.tokenY = SOL (sorts second)
 * // context.mapping.tokenAIsX = true (A maps to X)
 * ```
 *
 * @example
 * ```typescript
 * // User selected SOL first, USDC second (reversed)
 * const context = createTokenOrderContext(
 *   'So11111111111111111111111111111111111111112',  // SOL
 *   'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // USDC
 * );
 *
 * // Result:
 * // context.ui.tokenA = SOL (user's first choice)
 * // context.ui.tokenB = USDC (user's second choice)
 * // context.protocol.tokenX = USDC (still sorts first!)
 * // context.protocol.tokenY = SOL (still sorts second!)
 * // context.mapping.tokenAIsX = false (A maps to Y)
 * ```
 */
export function createTokenOrderContext(
  tokenA: string,
  tokenB: string,
): TokenOrderContext {
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(tokenA, tokenB);

  const tokenAIsX = tokenA === tokenXAddress;
  const tokenBIsY = tokenB === tokenYAddress;

  return {
    mapping: {
      tokenAIsX,
      tokenBIsY,
    },
    protocol: {
      tokenX: tokenXAddress as TokenAddress<ProtocolOrder>,
      tokenY: tokenYAddress as TokenAddress<ProtocolOrder>,
    },
    ui: {
      tokenA: tokenA as TokenAddress<UIOrder>,
      tokenB: tokenB as TokenAddress<UIOrder>,
    },
  };
}

/**
 * Maps token amounts from UI order to Protocol order.
 *
 * This pure function uses the mapping information in the context to correctly
 * route amounts to their protocol positions.
 *
 * @param amounts - Amounts in UI order (as entered by user)
 * @param context - Token order context from createTokenOrderContext
 * @returns Amounts mapped to Protocol order (ready for transaction)
 *
 * @example Using with React Query
 * ```typescript
 * function LPEstimationComponent() {
 *   const orderContext = useTokenOrder();
 *   const [formData] = useForm();
 *
 *   const protocolAmounts = orderContext
 *     ? mapAmountsToProtocol({
 *         tokenA: orderContext.ui.tokenA,
 *         tokenB: orderContext.ui.tokenB,
 *         amountA: formData.amountA,
 *         amountB: formData.amountB,
 *       }, orderContext)
 *     : null;
 *
 *   const { data } = useQuery({
 *     queryKey: ['lp', protocolAmounts?.amountX, protocolAmounts?.amountY],
 *     queryFn: () => estimateLP(protocolAmounts!.amountX, protocolAmounts!.amountY),
 *     enabled: !!protocolAmounts,
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * const context = createTokenOrderContext(USDC, SOL);
 * // context.mapping.tokenAIsX = true
 *
 * const uiAmounts = {
 *   tokenA: context.ui.tokenA,
 *   tokenB: context.ui.tokenB,
 *   amountA: "100", // User wants 100 USDC
 *   amountB: "200"  // User wants 200 SOL
 * };
 *
 * const protocolAmounts = mapAmountsToProtocol(uiAmounts, context);
 * // protocolAmounts.amountX = "100" (USDC amount)
 * // protocolAmounts.amountY = "200" (SOL amount)
 * ```
 *
 * @example
 * ```typescript
 * const context = createTokenOrderContext(SOL, USDC);
 * // context.mapping.tokenAIsX = false
 *
 * const uiAmounts = {
 *   tokenA: context.ui.tokenA,
 *   tokenB: context.ui.tokenB,
 *   amountA: "200", // User wants 200 SOL
 *   amountB: "100"  // User wants 100 USDC
 * };
 *
 * const protocolAmounts = mapAmountsToProtocol(uiAmounts, context);
 * // protocolAmounts.amountX = "100" (USDC amount - swapped!)
 * // protocolAmounts.amountY = "200" (SOL amount - swapped!)
 * ```
 */
export function mapAmountsToProtocol(
  amounts: TokenAmountsUI,
  context: TokenOrderContext,
): TokenAmountsProtocol {
  const { tokenAIsX } = context.mapping;

  return {
    amountX: tokenAIsX ? amounts.amountA : amounts.amountB,
    amountY: tokenAIsX ? amounts.amountB : amounts.amountA,
    tokenX: context.protocol.tokenX,
    tokenY: context.protocol.tokenY,
  };
}

/**
 * Maps token amounts from Protocol order back to UI order.
 *
 * This is the inverse of mapAmountsToProtocol. Useful when displaying protocol
 * results (like calculated amounts) back to the user in their preferred order.
 *
 * @param amounts - Amounts in Protocol order (from protocol calculation)
 * @param context - Token order context from createTokenOrderContext
 * @returns Amounts mapped to UI order (for display to user)
 *
 * @example Displaying protocol results
 * ```typescript
 * function ProportionalAmountDisplay() {
 *   const orderContext = useTokenOrder();
 *
 *   // Protocol calculated amounts in X/Y order
 *   const protocolResult = {
 *     tokenX: orderContext.protocol.tokenX,
 *     tokenY: orderContext.protocol.tokenY,
 *     amountX: "100",
 *     amountY: "200",
 *   };
 *
 *   // Map back to UI order for display
 *   const uiAmounts = mapAmountsToUI(protocolResult, orderContext);
 *
 *   return (
 *     <div>
 *       <p>You need {uiAmounts.amountA} of Token A</p>
 *       <p>You need {uiAmounts.amountB} of Token B</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * const context = createTokenOrderContext(SOL, USDC);
 * // User selected SOL first, but protocol sorted USDC first
 *
 * const protocolAmounts = {
 *   tokenX: context.protocol.tokenX,
 *   tokenY: context.protocol.tokenY,
 *   amountX: "100", // USDC amount
 *   amountY: "200"  // SOL amount
 * };
 *
 * const uiAmounts = mapAmountsToUI(protocolAmounts, context);
 * // uiAmounts.amountA = "200" (SOL - user's first choice)
 * // uiAmounts.amountB = "100" (USDC - user's second choice)
 * ```
 */
export function mapAmountsToUI(
  amounts: TokenAmountsProtocol,
  context: TokenOrderContext,
): TokenAmountsUI {
  const { tokenAIsX } = context.mapping;

  return {
    amountA: tokenAIsX ? amounts.amountX : amounts.amountY,
    amountB: tokenAIsX ? amounts.amountY : amounts.amountX,
    tokenA: context.ui.tokenA,
    tokenB: context.ui.tokenB,
  };
}

/**
 * Extracts just the mapping information from a context.
 *
 * Useful when you only need to know the A↔X relationship without the full context.
 *
 * @param context - Token order context
 * @returns Mapping information
 */
export function getOrderMapping(context: TokenOrderContext): OrderMapping {
  return context.mapping;
}

/**
 * Checks if two token pairs represent the same pool regardless of order.
 *
 * This is useful for:
 * - Validating that a user's selection matches an existing pool
 * - Checking if two different orderings refer to the same liquidity pool
 * - Query key deduplication
 *
 * Note: Accepts plain string pairs for flexibility (branded types are erased at runtime).
 *
 * @param pair1 - First token pair (can be UI or Protocol order, or plain strings)
 * @param pair2 - Second token pair (can be UI or Protocol order, or plain strings)
 * @returns True if both pairs represent the same pool
 *
 * @example
 * ```typescript
 * const pair1 = { tokenA: USDC, tokenB: SOL };
 * const pair2 = { tokenA: SOL, tokenB: USDC };
 *
 * areTokenPairsEquivalent(pair1, pair2); // true
 * ```
 *
 * @example
 * ```typescript
 * const pair1 = { tokenX: USDC, tokenY: SOL };
 * const pair2 = { tokenA: SOL, tokenB: USDC };
 *
 * areTokenPairsEquivalent(pair1, pair2); // true (works with mixed types)
 * ```
 */
export function areTokenPairsEquivalent(
  pair1:
    | TokenPairUI
    | TokenPairProtocol
    | { tokenA: string; tokenB: string }
    | { tokenX: string; tokenY: string },
  pair2:
    | TokenPairUI
    | TokenPairProtocol
    | { tokenA: string; tokenB: string }
    | { tokenX: string; tokenY: string },
): boolean {
  const addrs1 = [
    "tokenA" in pair1 ? pair1.tokenA : pair1.tokenX,
    "tokenB" in pair1 ? pair1.tokenB : pair1.tokenY,
  ].sort();

  const addrs2 = [
    "tokenA" in pair2 ? pair2.tokenA : pair2.tokenX,
    "tokenB" in pair2 ? pair2.tokenB : pair2.tokenY,
  ].sort();

  return addrs1[0] === addrs2[0] && addrs1[1] === addrs2[1];
}
