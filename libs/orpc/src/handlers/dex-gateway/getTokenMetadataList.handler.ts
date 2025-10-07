"use server";
import type {
  GetTokenMetadataListRequest,
  GetTokenMetadataListResponse,
} from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";
export async function getTokenMetadataListHandler(
  input: GetTokenMetadataListRequest,
): Promise<GetTokenMetadataListResponse> {
  const grpcClient = await getDexGatewayClient();
  const response = await grpcClient.getTokenMetadataList(input);
  return response;
}
