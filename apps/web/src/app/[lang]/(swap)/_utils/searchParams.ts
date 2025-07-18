import { createSearchParamsCache, parseAsString } from "nuqs/server";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "./constants";

export const selectedTokensParsers = {
  buyTokenAddress: parseAsString.withDefault(DEFAULT_BUY_TOKEN),
  sellTokenAddress: parseAsString.withDefault(DEFAULT_SELL_TOKEN),
};
export const selectedTokensCache = createSearchParamsCache(
  selectedTokensParsers,
);
