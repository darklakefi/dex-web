"use server";
import type { RemoveLiquidityRequest } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";
export async function removeLiquidityHandler(input: RemoveLiquidityRequest) {
  try {
    const grpcClient = await getDexGatewayClient();
    const removeLiquidityRequestData = {
      ...input,
    };
    const removeLiquidityResponse = await grpcClient.removeLiquidity(
      removeLiquidityRequestData,
    );
    return {
      success: true,
      unsignedTransaction: removeLiquidityResponse.unsignedTransaction,
    };
  } catch (error) {
    console.error("Error calling dex-gateway removeLiquidity:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userAddress: input.userAddress,
    });
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
