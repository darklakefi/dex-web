"use server";

import type { PartialMessage } from "@bufbuild/protobuf";
import type {
  CheckTradeStatusRequestPB,
  CheckTradeStatusResponsePB,
} from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function checkTradeStatusHandler(
  input: PartialMessage<CheckTradeStatusRequestPB>,
): Promise<CheckTradeStatusResponsePB> {
  const grpcClient = getDexGatewayClient();
  const response = await grpcClient.checkTradeStatus(input);
  return response;
}
