"use server";

import type { GetTokenMetadataListRequest } from "@dex-web/grpc-client";
import { tokensData, tokensDataMainnet } from "../../mocks/tokens.mock";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";
import { getTokenMetadataListHandler } from "../dex-gateway/getTokenMetadataList.handler";

export const getTokensHandler = async (
  input: GetTokensInput
): Promise<GetTokensOutput> => {
  const { limit = 10, query, offset = 0, allowList } = input;
  const page = Math.floor(offset / limit) + 1;

  const localTokensList =
    process.env.NEXT_PUBLIC_NETWORK === "2" ? tokensData : tokensDataMainnet;

  let gatewayTokensList: typeof localTokensList = [];

  if (query) {
    const gatewayInput: GetTokenMetadataListRequest = {
      filterBy:
        query.length > 30
          ? {
              case: "addressesList",
              value: {
                tokenAddresses: [query],
                $typeName: "darklake.v1.TokenAddressesList",
              },
            }
          : {
              case: "symbolsList",
              value: {
                tokenSymbols: [query],
                $typeName: "darklake.v1.TokenSymbolsList",
              },
            },
      pageNumber: page,
      pageSize: limit,
      $typeName: "darklake.v1.GetTokenMetadataListRequest",
    };
    const response = await getTokenMetadataListHandler(gatewayInput);
    gatewayTokensList = response.tokens;
  }

  const fullTokensList = [...localTokensList, ...gatewayTokensList];
  if (!query) {
    return {
      hasMore: localTokensList.length > limit,
      tokens: localTokensList.map((token) => ({
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

  const filteredTokensList = fullTokensList
    .filter((token) => (allowList ? allowList.includes(token.address) : true))
    .filter(
      (token) =>
        token.address.toUpperCase().includes(query.toUpperCase()) ||
        token.symbol.toUpperCase().includes(query.toUpperCase())
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
