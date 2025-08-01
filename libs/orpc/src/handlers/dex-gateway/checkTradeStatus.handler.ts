"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  CheckTradeStatusInput,
  CheckTradeStatusOutput,
} from "../../schemas/dex-gateway/checkTradeStatus.schema";

export async function checkTradeStatusHandler(input: CheckTradeStatusInput) {
  const grpcClient = getDexGatewayClient();
  const response: CheckTradeStatusOutput =
    await grpcClient.checkTradeStatus(input);
  return response;
}
