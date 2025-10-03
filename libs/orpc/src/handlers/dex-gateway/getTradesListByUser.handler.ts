"use server";

import type { GetTradesListByUserRequest } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function getTradesListByUserHandler(
  input: GetTradesListByUserRequest,
) {
  try {
    const grpcClient = await getDexGatewayClient();
    const tradesListResponse = await grpcClient.getTradesListByUser(input);
    return {
      data: tradesListResponse,
      success: true,
    };
  } catch (error) {
    console.error("Error calling dex-gateway swap:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
