"use server";

import type {
  GetTokenMetadataListRequest,
  GetTokenMetadataListResponse,
} from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function getTokenMetadataListHandler(
  input: GetTokenMetadataListRequest,
): Promise<GetTokenMetadataListResponse> {
  try {
    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.getTokenMetadataList(input);
    return response;
  } catch (error) {
    console.error("gRPC call failed:", error);
    throw error;
  }
}
