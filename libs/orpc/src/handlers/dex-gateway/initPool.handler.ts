"use server";
import type { InitPoolRequest, InitPoolResponse } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";
export async function initPoolHandler(
  input: InitPoolRequest,
): Promise<InitPoolResponse> {
  try {
    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.initPool(input);
    return response;
  } catch (error) {
    console.error("gRPC call failed:", error);
    throw error;
  }
}
