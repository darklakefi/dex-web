import { createSearchParamsCache, parseAsString } from "nuqs/server";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "./constants";

export const selectedTokensParsers = {
  tokenAAddress: parseAsString.withDefault(DEFAULT_BUY_TOKEN),
  tokenBAddress: parseAsString.withDefault(DEFAULT_SELL_TOKEN),
};
export const selectedTokensCache = createSearchParamsCache(
  selectedTokensParsers,
);

export const liquidityPageParsers = {
  ...selectedTokensParsers,
  type: parseAsString.withDefault(LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY),
};
export const liquidityPageCache = createSearchParamsCache(liquidityPageParsers);
