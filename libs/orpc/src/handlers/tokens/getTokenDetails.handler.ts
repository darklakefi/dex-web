"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  GetTokenDetailsInput,
  GetTokenDetailsOutput,
} from "../../schemas/tokens/getTokenDetails.schema";

export const getTokenDetailsHandler = async (
  input: GetTokenDetailsInput,
): Promise<GetTokenDetailsOutput> => {
  const { address } = input;

  const grpcClient = getDexGatewayClient();
  try {
    const tokenMetadata = await grpcClient.getTokenMetadata({
      token_address: address,
    });

    return {
      address: tokenMetadata.address,
      decimals: tokenMetadata.decimals,
      imageUrl: tokenMetadata.logo_uri,
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
    };
  } catch (error) {
    console.error(error, "error");
    throw new Error(`Token ${address} not found`);
  }
};
