"use server";

import type { PartialMessage } from "@bufbuild/protobuf";
import type { SendSignedTransactionRequestPB } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function submitSignedTransactionHandler(
  input: PartialMessage<SendSignedTransactionRequestPB>,
) {
  const grpcClient = getDexGatewayClient();

  try {
    const requestWithTradeId = {
      ...input,
      tradeId: input.tradeId || input.trackingId,
    };

    const response = await grpcClient.sendSignedTransaction(requestWithTradeId);

    if (!response.success) {
      console.error("Transaction submission failed:", {
        errorLogs: response.errorLogs,
        trackingId: input.trackingId,
        tradeId: response.tradeId,
      });
    }

    return response;
  } catch (error) {
    console.error("gRPC client error:", error);
    return {
      errorLogs: error instanceof Error ? error.message : "Unknown gRPC error",
      success: false,
      tradeId: input.tradeId,
    };
  }
}
