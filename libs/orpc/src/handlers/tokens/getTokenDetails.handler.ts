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

  console.log(address, "address");

  const grpcClient = getDexGatewayClient();
  try {
    const { token_metadata } = await grpcClient.getTokenMetadata({
      token_address: address,
    });

    return {
      address: token_metadata.address,
      decimals: token_metadata.decimals,
      imageUrl: token_metadata.logo_uri,
      name: token_metadata.name,
      symbol: token_metadata.symbol,
    };
  } catch (error) {
    console.error(error, "error");
    throw new Error(`Token ${address} not found`);
  }
};
