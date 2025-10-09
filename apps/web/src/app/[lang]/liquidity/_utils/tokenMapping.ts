import { sortSolanaAddresses } from "@dex-web/utils";

/**
 * Represents token metadata with decimals
 */
export interface TokenMetadata {
  readonly decimals: number;
  readonly address: string;
  readonly symbol?: string;
  readonly name?: string;
}

/**
 * Token pair in UI order (A/B)
 */
export interface TokenPairUI {
  readonly tokenA: TokenMetadata;
  readonly tokenB: TokenMetadata;
}

/**
 * Token pair in protocol order (X/Y - sorted by address)
 */
export interface TokenPairProtocol {
  readonly tokenX: TokenMetadata;
  readonly tokenY: TokenMetadata;
  readonly tokenAIsX: boolean;
}

/**
 * Maps tokens from UI order (A/B) to protocol order (X/Y).
 *
 * The protocol always uses sorted addresses where:
 * - tokenX = address that sorts first
 * - tokenY = address that sorts second
 *
 * This function ensures all calculations use the correct token order
 * and decimals regardless of how tokens are displayed in the UI.
 *
 * @param tokenPair - Token pair in UI order
 * @returns Token pair mapped to protocol order with sorting information
 *
 * @example
 * ```typescript
 * const uiPair = {
 *   tokenA: { address: 'DdLx...', decimals: 6 },
 *   tokenB: { address: 'HXsK...', decimals: 9 }
 * };
 *
 * const protocolPair = mapTokensUIToProtocol(uiPair);
 * // protocolPair.tokenX = token with address that sorts first
 * // protocolPair.tokenY = token with address that sorts second
 * // protocolPair.tokenAIsX = true if tokenA is tokenX
 * ```
 */
export function mapTokensUIToProtocol(
  tokenPair: TokenPairUI,
): TokenPairProtocol {
  const { tokenXAddress } = sortSolanaAddresses(
    tokenPair.tokenA.address,
    tokenPair.tokenB.address,
  );

  const tokenAIsX = tokenPair.tokenA.address === tokenXAddress;

  return {
    tokenAIsX,
    tokenX: tokenAIsX ? tokenPair.tokenA : tokenPair.tokenB,
    tokenY: tokenAIsX ? tokenPair.tokenB : tokenPair.tokenA,
  };
}

/**
 * Maps token amounts from UI order to protocol order.
 *
 * @param amounts - Token amounts in UI order
 * @param tokenAIsX - Whether tokenA is tokenX (from mapTokensUIToProtocol)
 * @returns Token amounts in protocol order
 */
export function mapAmountsUIToProtocol(
  amounts: { readonly amountA: string; readonly amountB: string },
  tokenAIsX: boolean,
): { readonly amountX: string; readonly amountY: string } {
  return {
    amountX: tokenAIsX ? amounts.amountA : amounts.amountB,
    amountY: tokenAIsX ? amounts.amountB : amounts.amountA,
  };
}

/**
 * Maps token amounts from protocol order back to UI order.
 * Useful for displaying results to the user.
 *
 * @param amounts - Token amounts in protocol order
 * @param tokenAIsX - Whether tokenA is tokenX (from mapTokensUIToProtocol)
 * @returns Token amounts in UI order
 */
export function mapAmountsProtocolToUI(
  amounts: { readonly amountX: string; readonly amountY: string },
  tokenAIsX: boolean,
): { readonly amountA: string; readonly amountB: string } {
  return {
    amountA: tokenAIsX ? amounts.amountX : amounts.amountY,
    amountB: tokenAIsX ? amounts.amountY : amounts.amountX,
  };
}
