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

  if (!address || address.trim() === "") {
    return {
      address: "",
      decimals: 0,
      imageUrl: undefined,
      name: "Select Token",
      symbol: "SELECT",
    };
  }

  const grpcClient = await getDexGatewayClient();
  try {
    const { tokenMetadata } = await grpcClient.getTokenMetadata({
      searchBy: {
        case: "tokenAddress",
        value: address,
      },
    });

    return {
      address: tokenMetadata?.address || "",
      decimals: tokenMetadata?.decimals || 0,
      imageUrl: tokenMetadata?.logoUri || undefined,
      name: tokenMetadata?.name || "Unknown Token",
      symbol: tokenMetadata?.symbol || address.slice(-4),
    };
  } catch (error) {
    console.error(error, "error");
    return {
      address: "",
      decimals: 0,
      imageUrl: undefined,
      name: "Unknown Token",
      symbol: address.slice(-4),
    };
  }
};
