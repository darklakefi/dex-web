import { createSearchParamsCache, parseAsString } from "nuqs/server";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "./constants";

function createSolanaAddressParser(defaultValue: string) {
  return parseAsString.withDefault(defaultValue).withOptions({
    history: "replace",
    shallow: true,
  });
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
  type: parseAsString
    .withDefault(LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY)
    .withOptions({
      history: "replace",
      shallow: true,
    }),
};
export const liquidityPageCache = createSearchParamsCache(liquidityPageParsers);
