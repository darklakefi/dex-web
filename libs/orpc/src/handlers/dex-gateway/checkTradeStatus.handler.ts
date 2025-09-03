"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  CheckTradeStatusRequest,
  CheckTradeStatusResponse,
} from "../../dex-gateway.type";

export async function checkTradeStatusHandler(input: CheckTradeStatusRequest) {
  const grpcClient = getDexGatewayClient();
  const response: CheckTradeStatusResponse =
    await grpcClient.checkTradeStatus(input);
  return response;
}
