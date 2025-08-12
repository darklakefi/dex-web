import { createSearchParamsCache, parseAsString } from "nuqs/server";

export const selectedTokensParsers = {
  buyTokenAddress: parseAsString.withDefault(
    process.env.NEXT_PUBLIC_DEFAULT_BUY_TOKEN ?? "",
  ),
  sellTokenAddress: parseAsString.withDefault(
    process.env.NEXT_PUBLIC_DEFAULT_SELL_TOKEN ?? "",
  ),
};
export const selectedTokensCache = createSearchParamsCache(
  selectedTokensParsers,
);
