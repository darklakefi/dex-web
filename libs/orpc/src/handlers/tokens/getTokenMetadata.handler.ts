import type { Token } from "./../../schemas/tokens/token.schema";

("use server");

import { getDexGatewayClient } from "../../dex-gateway";
import type { TokenMetadata } from "../../dex-gateway.type";
import type {
  GetTokenMetadataInput,
  GetTokenMetadataOutput,
} from "../../schemas/tokens/getTokenMetadata.schema";

const parseToken = (token: TokenMetadata): Token => ({
  address: token.address,
  decimals: token.decimals,
  imageUrl: token.logo_uri,
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

  const grpcClient = getDexGatewayClient();
  try {
    const { tokens } = await grpcClient.getTokenMetadataList({
      addresses_list: {
        token_addresses: addresses,
      },
      page_number: 1,
      page_size: addresses.length,
    });

    if (returnAsObject) {
      return tokens.reduce(
        (acc, token) => {
          acc[token.address] = parseToken(token);
          return acc;
        },
        {} as Record<string, Token>,
      );
    }

    return tokens.map(parseToken);
  } catch (error) {
    console.error(error, "error");
    return returnAsObject ? ({} as Record<string, Token>) : [];
  }
};
