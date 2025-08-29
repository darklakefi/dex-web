"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  SignedTransactionRequest,
  SignedTransactionResponse,
} from "../../dex-gateway.type";

export async function submitSignedTransactionHandler(
  input: SignedTransactionRequest,
) {
  const grpcClient = getDexGatewayClient();

  try {
    const requestWithTradeId = {
      ...input,
      trade_id: input.trade_id || input.tracking_id,
    };

    const response: SignedTransactionResponse =
      await grpcClient.submitSignedTransaction(requestWithTradeId);

    if (!response.success) {
      console.error("Transaction submission failed:", {
        errorLogs: response.error_logs,
        trackingId: input.tracking_id,
        tradeId: response.trade_id,
      });
    }

    return response;
  } catch (error) {
    console.error("gRPC client error:", error);
    return {
      error_logs: error instanceof Error ? error.message : "Unknown gRPC error",
      success: false,
      trade_id: input.trade_id,
    };
  }
}
