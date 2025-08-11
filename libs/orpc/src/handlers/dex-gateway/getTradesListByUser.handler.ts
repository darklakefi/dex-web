"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  GetTradesListByUserRequest,
  GetTradesListByUserResponse,
} from "../../dex-gateway.type";

export async function getTradesListByUserHandler(
  input: GetTradesListByUserRequest,
) {
  try {
    const grpcClient = getDexGatewayClient();
    // console.log(input, "input");
    const tradesListResponse: GetTradesListByUserResponse =
      await grpcClient.getTradesListByUser(input);
    // console.log(tradesListResponse, "tradesListResponse");
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
