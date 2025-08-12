import { createSearchParamsCache, parseAsString } from "nuqs/server";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "./constants";

export const selectedTokensParsers = {
  tokenAAddress: parseAsString.withDefault(DEFAULT_BUY_TOKEN),
  tokenBAddress: parseAsString.withDefault(DEFAULT_SELL_TOKEN),
};
export const selectedTokensCache = createSearchParamsCache(
  selectedTokensParsers,
);
