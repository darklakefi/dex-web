"use server";

import type { PartialMessage } from "@bufbuild/protobuf";
import type { GetTradesListByUserRequestPB } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function getTradesListByUserHandler(
  input: PartialMessage<GetTradesListByUserRequestPB>,
) {
  try {
    const grpcClient = getDexGatewayClient();
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
