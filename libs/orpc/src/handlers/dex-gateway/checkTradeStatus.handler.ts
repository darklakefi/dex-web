"use server";

import type {
  CheckTradeStatusRequest,
  CheckTradeStatusResponse,
} from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function checkTradeStatusHandler(
  input: CheckTradeStatusRequest,
): Promise<CheckTradeStatusResponse> {
  const grpcClient = await getDexGatewayClient();
  const response = await grpcClient.checkTradeStatus(input);
  return response;
}
