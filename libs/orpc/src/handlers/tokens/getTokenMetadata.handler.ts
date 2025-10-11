"use server";

import type { TokenMetadata } from "@dex-web/grpc-client";
import { isSolanaAddress } from "@dex-web/utils";
import { getDexGatewayClient } from "../../dex-gateway";
import type {
  GetTokenMetadataInput,
  GetTokenMetadataOutput,
} from "../../schemas/tokens/getTokenMetadata.schema";
import type { Token } from "./../../schemas/tokens/token.schema";

const parseToken = (token: TokenMetadata): Token => ({
  address: token.address,
  decimals: token.decimals,
  imageUrl: token.logoUri,
  name: token.name,
  symbol: token.symbol,
});

export const getTokenMetadataHandler = async (
  input: GetTokenMetadataInput,
): Promise<GetTokenMetadataOutput> => {
  const { addresses, returnAsObject } = input;

  if (!addresses || addresses.length === 0) {
    return returnAsObject ? ({} as Record<string, Token>) : [];
  }

  const solanaAddresses = addresses.filter(isSolanaAddress);

  if (solanaAddresses.length === 0) {
    return returnAsObject ? ({} as Record<string, Token>) : [];
  }

  const grpcClient = await getDexGatewayClient();
  try {
    const { tokens: grpcTokens } = await grpcClient
      .getTokenMetadataList({
        filterBy: {
          case: "addressesList",
          value: {
            tokenAddresses: addresses,
          },
        },
        pageNumber: 1,
        pageSize: addresses.length,
      })
      .catch(() => {
        return { tokens: [] as TokenMetadata[] };
      });

    const tokens: Token[] = grpcTokens.map(parseToken);

    // No external fallbacks: only use data from the gateway.

    if (returnAsObject) {
      return tokens.reduce(
        (acc, token) => {
          acc[token.address] = token;
          return acc;
        },
        {} as Record<string, Token>,
      );
    }
    return tokens;
  } catch (error) {
    console.error(error, "error");
    return returnAsObject ? ({} as Record<string, Token>) : [];
  }
};
