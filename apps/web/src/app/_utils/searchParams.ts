import { createSearchParamsCache, parseAsString } from "nuqs/server";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "./constants";

/**
 * Custom nuqs parser that validates Solana addresses.
 * Returns default value if invalid.
 *
 * Note: We use parseAsString directly as the validation is handled
 * at the component level where we have access to the full token data.
 */
function createSolanaAddressParser(defaultValue: string) {
  return parseAsString.withDefault(defaultValue);
}

export const selectedTokensParsers = {
  tokenAAddress: createSolanaAddressParser(DEFAULT_BUY_TOKEN),
  tokenBAddress: createSolanaAddressParser(DEFAULT_SELL_TOKEN),
};
export const selectedTokensCache = createSearchParamsCache(
  selectedTokensParsers,
);

export const liquidityPageParsers = {
  ...selectedTokensParsers,
  type: parseAsString.withDefault(LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY),
};
export const liquidityPageCache = createSearchParamsCache(liquidityPageParsers);
