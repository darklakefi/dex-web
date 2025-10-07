"use server";

import type { GetTokenMetadataListRequest } from "@dex-web/grpc-client";
import type { ClientContext } from "../../client";
import { tokensData, tokensDataMainnet } from "../../mocks/tokens.mock";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";
import { getTokensAllowList } from "../../utils/getTokensAllowList";
import { getTokenMetadataListHandler } from "../dex-gateway/getTokenMetadataList.handler";

interface ContextWithHeaders extends ClientContext {
  headers?: {
    referer?: string;
    referrer?: string;
  };
}

const isSwapContext = (context?: ClientContext): boolean => {
  if (!context || typeof context !== "object") return false;

  const contextWithHeaders = context as ContextWithHeaders;
  const headers = contextWithHeaders.headers;
  if (!headers || typeof headers !== "object") return false;

  const referer = headers.referer || headers.referrer;
  if (!referer || typeof referer !== "string") return false;

  const swapPaths = ["/select-token/", "/(swap)/", "/swap/"];

  return swapPaths.some((path) => referer.includes(path));
};

export const getTokensHandler = async (
  input: GetTokensInput,
  context?: ClientContext,
): Promise<GetTokensOutput> => {
  const { limit = 10, query, offset = 0, allowList } = input;
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
    const effectiveAllowList = isSwapContext(context)
      ? getTokensAllowList()
      : allowList;
    const filteredTokens = effectiveAllowList
      ? localTokensList.filter((token) =>
          effectiveAllowList.includes(token.address),
        )
      : localTokensList;

    return {
      hasMore: filteredTokens.length > limit,
      tokens: filteredTokens.slice(0, limit).map((token) => ({
        address: token.address,
        decimals: token.decimals,
        imageUrl: token.logoUri,
        name: token.name,
        symbol: token.symbol,
      })),
      total: filteredTokens.length,
    };
  }

  const total = fullTokensList.length;
  const hasMore = fullTokensList.length > limit;

  const effectiveAllowList = isSwapContext(context)
    ? getTokensAllowList()
    : allowList;

  const filteredTokensList = fullTokensList
    .filter((token) =>
      effectiveAllowList ? effectiveAllowList.includes(token.address) : true,
    )
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
      imageUrl: token.logoUri,
      name: token.name,
      symbol: token.symbol,
    })),
    total,
  };
};
