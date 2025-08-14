"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  GetTokenMetadataListRequest,
  GetTokenMetadataListResponse,
} from "../../dex-gateway.type";

export async function getTokenMetadataListHandler(
  input: GetTokenMetadataListRequest,
) {
  const grpcClient = getDexGatewayClient();
  const response: GetTokenMetadataListResponse =
    await grpcClient.getTokenMetadataList(input);
  return response;
}
