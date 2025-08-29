"use server";

import type { GetTokenMetadataListRequest } from "../../dex-gateway.type";
import { tokensData, tokensDataMainnet } from "../../mocks/tokens.mock";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";
import { getTokenMetadataListHandler } from "../dex-gateway/getTokenMetadataList.handler";

export const getTokensHandler = async (
  input: GetTokensInput,
): Promise<GetTokensOutput> => {
  const { limit = 10, query, offset = 0, allowList } = input;
  const page = Math.floor(offset / limit) + 1;

  const localTokensList =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? tokensData : tokensDataMainnet;

  const gatewayInput: GetTokenMetadataListRequest = {
    addresses_list: query
      ? {
          token_addresses: [query],
        }
      : undefined,
    page_number: page,
    page_size: limit,
    symbols_list: query
      ? {
          token_symbols: [query],
        }
      : undefined,
  };
  const { tokens: gatewayTokensList } =
    await getTokenMetadataListHandler(gatewayInput);

  const fullTokensList = [...localTokensList, ...gatewayTokensList];
  if (!query) {
    return {
      hasMore: localTokensList.length > limit,
      tokens: localTokensList.map((token) => ({
        address: token.address,
        decimals: token.decimals,
        imageUrl: token.logo_uri,
        name: token.name,
        symbol: token.symbol,
      })),
      total: localTokensList.length,
    };
  }

  const total = fullTokensList.length;
  const hasMore = fullTokensList.length > limit;

  const filteredTokensList = fullTokensList
    .filter((token) => (allowList ? allowList.includes(token.address) : true))
    .filter(
      (token) =>
        token.address.toUpperCase().includes(query.toUpperCase()) ||
        token.symbol.toUpperCase().includes(query.toUpperCase()),
    );

  return {
    hasMore,
    tokens: filteredTokensList.map((token) => ({
      address: token.address,
      decimals: token.decimals,
      imageUrl: token.logo_uri,
      name: token.name,
      symbol: token.symbol,
    })),
    total,
  };
};
