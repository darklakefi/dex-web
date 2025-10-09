import { isValidSolanaAddress } from "@dex-web/utils";
import { createSearchParamsCache, parseAsString } from "nuqs/server";
import { z } from "zod";
import {
  DEFAULT_BUY_TOKEN,
  DEFAULT_SELL_TOKEN,
  LIQUIDITY_PAGE_TYPE,
} from "./constants";

/**
 * Zod schema for Solana token addresses.
 * Validates that the address is a valid Solana public key.
 */
const solanaAddressSchema = z
  .string()
  .refine((addr) => isValidSolanaAddress(addr), {
    message: "Invalid Solana address",
  });

/**
 * Custom nuqs parser that validates Solana addresses using Zod.
 * Returns null if invalid, allowing nuqs to use the default value.
 */
function createSolanaAddressParser(defaultValue: string) {
  return parseAsString
    .withOptions({
      parse: (value) => {
        const result = solanaAddressSchema.safeParse(value);
        return result.success ? result.data : null;
      },
    })
    .withDefault(defaultValue);
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
