"use server";

import type { GetTokenMetadataListRequest } from "@dex-web/grpc-client";
import { tokensData, tokensDataMainnet } from "../../mocks/tokens.mock";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";
import { getTokenMetadataListHandler } from "../dex-gateway/getTokenMetadataList.handler";

export const getTokensHandler = async (
  input: GetTokensInput,
): Promise<GetTokensOutput> => {
  const { limit = 10, query, offset = 0 } = input;
  const page = Math.floor(offset / limit) + 1;

  const localTokensList =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? tokensData : tokensDataMainnet;

  let gatewayTokensList: typeof localTokensList = [];

  if (query) {
    const gatewayInput: GetTokenMetadataListRequest = {
      $typeName: "darklake.v1.GetTokenMetadataListRequest",
      filterBy:
        query.length > 30
          ? {
              case: "addressesList",
              value: {
                $typeName: "darklake.v1.TokenAddressesList",
                tokenAddresses: [query],
              },
            }
          : {
              case: "substring",
              value: query,
            },
      pageNumber: page,
      pageSize: limit,
    };
    const response = await getTokenMetadataListHandler(gatewayInput);
    gatewayTokensList = response.tokens;
  }

  const fullTokensList = [...localTokensList, ...gatewayTokensList];
  if (!query) {
    return {
      hasMore: localTokensList.length > limit,
      tokens: localTokensList.slice(0, limit).map((token) => ({
        address: token.address,
        decimals: token.decimals,
        imageUrl: token.logoUri,
        name: token.name,
        symbol: token.symbol,
      })),
      total: localTokensList.length,
    };
  }

  const total = fullTokensList.length;
  const hasMore = fullTokensList.length > limit;

  const filteredTokensList = fullTokensList.filter(
    (token) =>
      token.address.toUpperCase().includes(query.toUpperCase()) ||
      token.symbol.toUpperCase().includes(query.toUpperCase()),
  );

  return {
    hasMore,
    tokens: filteredTokensList.map((token) => ({
      address: token.address,
      decimals: token.decimals,
      imageUrl: token.logoUri,
      name: token.name,
      symbol: token.symbol,
    })),
    total,
  };
};
