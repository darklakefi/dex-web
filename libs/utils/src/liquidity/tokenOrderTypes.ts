/**
 * Token Order Type System
 *
 * This module provides branded types to ensure compile-time safety when working
 * with tokens in different ordering contexts:
 * - UI Order: The order tokens appear in URL params / user selection
 * - Protocol Order: The canonical sorted order required by the protocol
 *
 * Branded types prevent accidentally mixing these contexts, catching errors at
 * compile time rather than runtime.
 *
 * @module tokenOrderTypes
 */

/**
 * Brand for UI order - represents user's selection order from URL params
 */
export type UIOrder = { readonly __brand: "UI" };

/**
 * Brand for Protocol order - represents sorted order for protocol operations
 */
export type ProtocolOrder = { readonly __brand: "Protocol" };

/**
 * Token address branded with its ordering context.
 * This prevents mixing UI and Protocol orders at compile time.
 *
 * @example
 * ```typescript
 * const uiToken: TokenAddress<UIOrder> = "EPj..." as TokenAddress<UIOrder>;
 * const protocolToken: TokenAddress<ProtocolOrder> = "So1..." as TokenAddress<ProtocolOrder>;
 *
 * // ❌ Type error - can't mix orders
 * function needsProtocol(token: TokenAddress<ProtocolOrder>) {}
 * needsProtocol(uiToken); // Compile error!
 * ```
 */
export type TokenAddress<Order> = string & { readonly __order: Order };

/**
 * Token pair in UI order (user's selection from URL parameters).
 * This represents how the user chose to view/interact with the tokens.
 */
export interface TokenPairUI {
  readonly tokenA: TokenAddress<UIOrder>;
  readonly tokenB: TokenAddress<UIOrder>;
}

/**
 * Token pair in Protocol order (sorted by address).
 * The protocol always expects tokenX to sort before tokenY.
 */
export interface TokenPairProtocol {
  readonly tokenX: TokenAddress<ProtocolOrder>;
  readonly tokenY: TokenAddress<ProtocolOrder>;
}

/**
 * Token amounts paired with their addresses in UI order.
 * Used for user input and display.
 */
export interface TokenAmountsUI {
  readonly tokenA: TokenAddress<UIOrder>;
  readonly tokenB: TokenAddress<UIOrder>;
  readonly amountA: string;
  readonly amountB: string;
}

/**
 * Token amounts paired with their addresses in Protocol order.
 * Used for protocol transactions and calculations.
 */
export interface TokenAmountsProtocol {
  readonly tokenX: TokenAddress<ProtocolOrder>;
  readonly tokenY: TokenAddress<ProtocolOrder>;
  readonly amountX: string;
  readonly amountY: string;
}

/**
 * Mapping information that describes how UI order relates to Protocol order.
 * This is the key to translating between the two coordinate systems.
 */
export interface OrderMapping {
  /**
   * True if tokenA from UI order is tokenX in Protocol order.
   * False if tokenA from UI order is tokenY in Protocol order.
   */
  readonly tokenAIsX: boolean;

  /**
   * True if tokenB from UI order is tokenY in Protocol order.
   * False if tokenB from UI order is tokenX in Protocol order.
   *
   * Note: This is always the inverse of tokenAIsX.
   * Provided for convenience and readability.
   */
  readonly tokenBIsY: boolean;
}

/**
 * Complete token order context containing all three representations:
 * 1. UI order (user's selection)
 * 2. Protocol order (sorted addresses)
 * 3. Mapping (how to translate between them)
 *
 * This is the single source of truth for token ordering in a component tree.
 *
 * @example
 * ```typescript
 * const context: TokenOrderContext = {
 *   ui: {
 *     tokenA: 'So1...' as TokenAddress<UIOrder>,
 *     tokenB: 'EPj...' as TokenAddress<UIOrder>
 *   },
 *   protocol: {
 *     tokenX: 'EPj...' as TokenAddress<ProtocolOrder>,  // Sorts first
 *     tokenY: 'So1...' as TokenAddress<ProtocolOrder>   // Sorts second
 *   },
 *   mapping: {
 *     tokenAIsX: false,  // tokenA (So1) is tokenY in protocol
 *     tokenBIsY: false   // tokenB (EPj) is tokenX in protocol
 *   }
 * };
 * ```
 */
export interface TokenOrderContext {
  readonly ui: TokenPairUI;
  readonly protocol: TokenPairProtocol;
  readonly mapping: OrderMapping;
}
