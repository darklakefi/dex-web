"use server";

import { getDexGatewayClient } from "../../dex-gateway";

export async function getTokenMetadataListHandler(input: any): Promise<any> {
  try {
    const grpcClient = getDexGatewayClient();
    const response = await grpcClient.getTokenMetadataList(input);
    return response;
  } catch (error) {
    console.error("gRPC call failed:", error);
    throw error;
  }
}
