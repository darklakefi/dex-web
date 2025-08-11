"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type { GetTokenMetadataListRequest } from "../../dex-gateway.type";
import { tokensData, tokensDataMainnet } from "../../mocks/tokens.mock";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";
import { isSolanaAddress } from "../../utils/solana";

export const getTokensHandler = async (
  input: GetTokensInput,
): Promise<GetTokensOutput> => {
  const { limit = 10, query, offset = 0 } = input;

  if (!query) {
    const defaultList =
      process.env.NETWORK === "2" ? tokensData : tokensDataMainnet;

    return {
      hasMore: defaultList.length > limit,
      tokens: defaultList.slice(0, limit).map((token) => ({
        address: token.address,
        decimals: token.decimals,
        imageUrl: token.logoURI,
        name: token.name,
        symbol: token.symbol,
      })),
      total: defaultList.length,
    };
  }

  const grpcClient = getDexGatewayClient();

  const page = Math.floor(offset / limit) + 1;

  const gatewayInput: GetTokenMetadataListRequest = {
    page_number: page,
    page_size: limit,
  };

  if (query) {
    if (isSolanaAddress(query)) {
      gatewayInput.addresses_list = {
        token_addresses: [query],
      };
    } else {
      gatewayInput.symbols_list = {
        token_symbols: [query],
      };
    }
  }

  const tokenMetadataList = await grpcClient.getTokenMetadataList(gatewayInput);
  const total = tokenMetadataList.total_pages * limit;
  const hasMore =
    tokenMetadataList.current_page < tokenMetadataList.total_pages;

  return {
    hasMore,
    tokens: tokenMetadataList.tokens.map((token) => ({
      address: token.address,
      decimals: token.decimals,
      imageUrl: token.logo_uri,
      name: token.name,
      symbol: token.symbol,
    })),
    total,
  };
};
